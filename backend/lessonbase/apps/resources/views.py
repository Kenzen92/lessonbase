from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.core.authentication import ExpiringTokenAuthentication as TokenAuthentication
from apps.resources.models import Resource, ResourceTag, ClassResource, AssignmentMaterial
from apps.resources.serializers import (
    ResourceSerializer,
    ResourceCreateSerializer,
    ResourceUpdateSerializer,
    ResourceTagSerializer,
)
from apps.user_accounts.models import Teacher, Student


class ResourceTagViewSet(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request):
        tags = ResourceTag.objects.filter(owner=request.user)
        return Response(ResourceTagSerializer(tags, many=True).data)

    def create(self, request):
        name = request.data.get("name", "").strip()
        if not name:
            return Response(
                {"error": "Tag name is required."}, status=status.HTTP_400_BAD_REQUEST
            )
        tag, _ = ResourceTag.objects.get_or_create(owner=request.user, name=name)
        return Response(ResourceTagSerializer(tag).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        tag = get_object_or_404(ResourceTag, pk=pk, owner=request.user)
        tag.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResourceViewSet(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request):
        qs = Resource.objects.filter(owner=request.user)
        q = request.query_params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
        subject = request.query_params.get("subject")
        if subject:
            qs = qs.filter(subject_id=subject)
        kind = request.query_params.get("kind")
        if kind:
            qs = qs.filter(kind=kind)
        tag = request.query_params.get("tag")
        if tag:
            qs = qs.filter(tags__id=tag)
        return Response(ResourceSerializer(qs, many=True).data)

    def create(self, request):
        serializer = ResourceCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        resource = serializer.create(serializer.validated_data)
        return Response(ResourceSerializer(resource).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        resource = get_object_or_404(Resource, pk=pk)
        self._check_readable(resource, request.user)
        return Response(ResourceSerializer(resource).data)

    def partial_update(self, request, pk=None):
        resource = get_object_or_404(Resource, pk=pk)
        if resource.owner_id != request.user.pk:
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = ResourceUpdateSerializer(
            resource, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ResourceSerializer(resource).data)

    def destroy(self, request, pk=None):
        resource = get_object_or_404(Resource, pk=pk)
        if resource.owner_id != request.user.pk:
            return Response(status=status.HTTP_403_FORBIDDEN)
        resource.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request, pk=None):
        resource = get_object_or_404(Resource.all_objects, pk=pk)
        if resource.owner_id != request.user.pk:
            return Response(status=status.HTTP_403_FORBIDDEN)
        resource.restore()
        return Response(ResourceSerializer(resource).data)

    @action(detail=False, methods=["get"], url_path="shared")
    def shared(self, request):
        """Resources shared with the current user via class or assignment membership."""
        user = request.user.get_real_instance()

        if isinstance(user, Student):
            qs = Resource.objects.filter(
                Q(class_links__class_event__students=user)
                | Q(assignment_links__assignment__students=user)
            ).distinct()
        else:
            qs = Resource.objects.filter(
                Q(class_links__class_event__teachers=user)
                | Q(assignment_links__assignment__teachers=user)
            ).distinct()

        return Response(ResourceSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"], url_path="usage")
    def usage(self, request, pk=None):
        resource = get_object_or_404(Resource, pk=pk)
        if resource.owner_id != request.user.pk:
            return Response(status=status.HTTP_403_FORBIDDEN)

        class_links = list(
            resource.class_links.select_related("class_event__subject").values(
                "class_event__id", "class_event__name", "class_event__subject__name"
            )
        )
        assignment_links = list(
            resource.assignment_links.select_related("assignment").values(
                "assignment__id", "assignment__title"
            )
        )
        return Response(
            {
                "class_events": class_links,
                "assignments": assignment_links,
                "total": len(class_links) + len(assignment_links),
            }
        )

    @staticmethod
    def _check_readable(resource, user):
        """Raise 403 if user cannot read this resource."""
        if resource.owner_id == user.pk:
            return
        user_real = user.get_real_instance() if hasattr(user, "get_real_instance") else user
        if isinstance(user_real, Student):
            accessible = (
                Resource.objects.filter(
                    pk=resource.pk,
                ).filter(
                    Q(class_links__class_event__students=user_real)
                    | Q(assignment_links__assignment__students=user_real)
                    | Q(submission_links__student=user_real)
                ).exists()
            )
        else:
            accessible = (
                Resource.objects.filter(
                    pk=resource.pk,
                ).filter(
                    Q(class_links__class_event__teachers=user_real)
                    | Q(assignment_links__assignment__teachers=user_real)
                ).exists()
            )
        if not accessible:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this resource.")


class ClassEventResourcesViewSet(viewsets.ViewSet):
    """Attach / detach Resources to a ClassEvent."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_class_event(self, pk):
        from apps.classes.models import ClassEvent
        return get_object_or_404(ClassEvent, pk=pk)

    def list(self, request, class_event_pk=None):
        class_event = self._get_class_event(class_event_pk)
        links = class_event.resource_links.select_related("resource").all()
        return Response(ResourceSerializer([l.resource for l in links], many=True).data)

    def create(self, request, class_event_pk=None):
        from apps.resources.models import ALLOWED_MIME_TYPES, MAX_FILE_SIZE

        class_event = self._get_class_event(class_event_pk)
        user = request.user.get_real_instance()

        if not isinstance(user, Teacher):
            return Response(
                {"error": "Only teachers can attach resources to a class."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not class_event.teachers.filter(pk=user.pk).exists():
            return Response(
                {"error": "You do not teach this class."},
                status=status.HTTP_403_FORBIDDEN,
            )

        resource_id = request.data.get("resource_id")
        if resource_id:
            resource = get_object_or_404(Resource, pk=resource_id, owner=user)
        elif request.FILES.get("file"):
            uploaded = request.FILES["file"]
            if uploaded.size > MAX_FILE_SIZE:
                return Response(
                    {"error": "File exceeds 50 MB limit."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if uploaded.content_type not in ALLOWED_MIME_TYPES:
                return Response(
                    {"error": "File type not allowed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            resource = Resource.objects.create(
                owner=user,
                title=uploaded.name,
                kind=Resource.Kind.FILE,
                file=uploaded,
                original_name=uploaded.name,
                mime_type=uploaded.content_type,
                size_bytes=uploaded.size,
            )
        else:
            return Response(
                {"error": "Provide resource_id or a file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ClassResource.objects.get_or_create(
            class_event=class_event, resource=resource, defaults={"added_by": user}
        )
        return Response(ResourceSerializer(resource).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, class_event_pk=None, pk=None):
        class_event = self._get_class_event(class_event_pk)
        user = request.user.get_real_instance()

        if not isinstance(user, Teacher):
            return Response(
                {"error": "Only teachers can detach resources."},
                status=status.HTTP_403_FORBIDDEN,
            )

        deleted, _ = ClassResource.objects.filter(
            class_event=class_event, resource_id=pk
        ).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
