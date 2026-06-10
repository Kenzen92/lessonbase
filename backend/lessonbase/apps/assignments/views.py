from django.shortcuts import get_object_or_404
from apps.user_accounts.models import Teacher, Student
from rest_framework.decorators import action
from apps.core.authentication import ExpiringTokenAuthentication as TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework import status
from apps.assignments.models import Assignment, Submission, Feedback
from rest_framework import viewsets
from django.utils import timezone
from django.db.models import Q, CharField, Case, When, Value

from apps.assignments.serialisers import (
    AssignmentCreateSerializer,
    AssignmentDetailsSerializer,
    AssignmentListSerializer,
    SubmissionCreateSerializer,
    SubmissionDetailsSerializer,
    SubmissionListSerializer,
    FeedbackSerializer,
)


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentDetailsSerializer
    queryset = Assignment.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return AssignmentCreateSerializer
        if self.action == "list":
            return AssignmentListSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        user = self.request.user
        return (
            Assignment.objects.filter(Q(teachers=user) | Q(students=user))
            .distinct()
            .prefetch_related("teachers", "material_links__resource")
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(status=status.HTTP_201_CREATED)

    def list(self, request):
        now = timezone.now().date()
        assignments = (
            self.get_queryset()
            .annotate(
                category=Case(
                    When(Q(marked=True), then=Value("Complete")),
                    When(
                        Q(marked=False) & Q(set_date__gt=now), then=Value("Upcoming")
                    ),
                    When(Q(marked=False) & Q(to_mark=False), then=Value("Set")),
                    When(Q(marked=False) & Q(to_mark=True), then=Value("To Mark")),
                    default=Value("Uncategorized"),
                    output_field=CharField(),
                )
            )
            .order_by("due_date")
        )

        categorized_data = {"To Mark": [], "Set": [], "Upcoming": [], "Complete": []}
        for assignment in assignments:
            assignment_data = AssignmentListSerializer(assignment).data
            categorized_data[assignment.category].append(assignment_data)

        return Response(categorized_data, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # Nested resource: submissions
    # ------------------------------------------------------------------

    @action(detail=True, methods=["get", "post"], url_path="submissions")
    def submissions(self, request, pk=None):
        assignment = get_object_or_404(Assignment, pk=pk)
        user = request.user.get_real_instance()

        if request.method == "GET":
            if isinstance(user, Teacher):
                qs = Submission.objects.filter(assignment=assignment)
            else:
                qs = Submission.objects.filter(assignment=assignment, student=user)
            serializer = SubmissionListSerializer(qs, many=True)
            return Response(serializer.data)

        # POST — student submits
        if not isinstance(user, Student):
            return Response(
                {"error": "Only students can submit assignments."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not assignment.students.filter(pk=user.pk).exists():
            return Response(
                {"error": "You are not assigned to this assignment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data.copy()
        data["assignment"] = pk
        serializer = SubmissionCreateSerializer(
            data=data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        submission = serializer.create(serializer.validated_data)
        return Response(
            SubmissionDetailsSerializer(submission).data,
            status=status.HTTP_201_CREATED,
        )

    # ------------------------------------------------------------------
    # Nested resource: materials (attach / detach)
    # ------------------------------------------------------------------

    @action(detail=True, methods=["get", "post"], url_path="materials")
    def materials(self, request, pk=None):
        from apps.resources.models import Resource, AssignmentMaterial, ALLOWED_MIME_TYPES
        from apps.resources.quota import upload_violation
        from apps.resources.serializers import ResourceSerializer

        assignment = get_object_or_404(Assignment, pk=pk)
        user = request.user.get_real_instance()

        if request.method == "GET":
            links = assignment.material_links.select_related("resource").all()
            return Response(
                ResourceSerializer([l.resource for l in links], many=True).data
            )

        # POST — teacher attaches a resource
        if not isinstance(user, Teacher):
            return Response(
                {"error": "Only teachers can attach materials."},
                status=status.HTTP_403_FORBIDDEN,
            )

        resource_id = request.data.get("resource_id")
        if resource_id:
            resource = get_object_or_404(Resource, pk=resource_id, owner=user)
        elif request.FILES.get("file"):
            uploaded = request.FILES["file"]
            if uploaded.content_type not in ALLOWED_MIME_TYPES:
                return Response(
                    {"error": "File type not allowed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            quota_error = upload_violation(user, [uploaded])
            if quota_error:
                return Response(
                    {"error": quota_error}, status=status.HTTP_400_BAD_REQUEST
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

        AssignmentMaterial.objects.get_or_create(assignment=assignment, resource=resource)
        return Response(ResourceSerializer(resource).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"materials/(?P<resource_id>\d+)",
    )
    def delete_material(self, request, pk=None, resource_id=None):
        from apps.resources.models import AssignmentMaterial

        assignment = get_object_or_404(Assignment, pk=pk)
        user = request.user.get_real_instance()

        if not isinstance(user, Teacher):
            return Response(
                {"error": "Only teachers can detach materials."},
                status=status.HTTP_403_FORBIDDEN,
            )

        deleted, _ = AssignmentMaterial.objects.filter(
            assignment=assignment, resource_id=resource_id
        ).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubmissionViewSet(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, pk=None):
        submission = get_object_or_404(Submission, pk=pk)
        user = request.user.get_real_instance()
        self._check_access(submission, user)
        return Response(SubmissionDetailsSerializer(submission).data)

    def partial_update(self, request, pk=None):
        submission = get_object_or_404(Submission, pk=pk)
        user = request.user.get_real_instance()

        if not isinstance(user, Student) or submission.student_id != user.pk:
            return Response(
                {"error": "Only the submitting student can update this submission."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if submission.status not in (Submission.Status.DRAFT, Submission.Status.RETURNED):
            return Response(
                {"error": "Submission cannot be edited in its current state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "answer_text" in request.data:
            submission.answer_text = request.data["answer_text"]
        submission.submit()
        return Response(SubmissionDetailsSerializer(submission).data)

    # ------------------------------------------------------------------
    # Nested: feedback
    # ------------------------------------------------------------------

    @action(detail=True, methods=["get", "put"], url_path="feedback")
    def feedback(self, request, pk=None):
        submission = get_object_or_404(Submission, pk=pk)
        user = request.user.get_real_instance()

        if request.method == "GET":
            self._check_access(submission, user)
            try:
                fb = submission.feedback
                return Response(self._serialize_feedback(fb))
            except Feedback.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)

        # PUT — teacher creates or overwrites feedback
        if not isinstance(user, Teacher):
            return Response(
                {"error": "Only teachers can submit feedback."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = FeedbackSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        fb = serializer.upsert(submission, teacher=user)
        return Response(self._serialize_feedback(fb), status=status.HTTP_200_OK)

    @staticmethod
    def _check_access(submission, user):
        is_student = isinstance(user, Student) and submission.student_id == user.pk
        is_teacher = isinstance(user, Teacher) and submission.assignment.teachers.filter(
            pk=user.pk
        ).exists()
        if not (is_student or is_teacher):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this submission.")

    @staticmethod
    def _serialize_feedback(fb):
        return {
            "id": fb.id,
            "submission": fb.submission_id,
            "teacher": fb.teacher_id,
            "text": fb.text,
            "score": fb.score,
            "accepted": fb.accepted,
            "files": [
                {
                    "id": r.id,
                    "title": r.title,
                    "kind": r.kind,
                    "file": r.file.url if r.file else None,
                    "url": r.url,
                    "original_name": r.original_name,
                    "mime_type": r.mime_type,
                    "size_bytes": r.size_bytes,
                }
                for r in fb.files.all()
            ],
            "created_at": fb.created_at,
            "updated_at": fb.updated_at,
        }

    # Legacy: retrieve submission by assignment + student (for backward compat)
    @action(
        detail=False,
        methods=["get"],
        url_path=r"by-assignment/(?P<assignment_id>\d+)/student/(?P<student_id>\d+)",
    )
    def retrieve_by_assignment_and_student(
        self, request, assignment_id=None, student_id=None
    ):
        submission = get_object_or_404(
            Submission,
            assignment_id=assignment_id,
            student_id=student_id,
        )
        user = request.user.get_real_instance()
        self._check_access(submission, user)
        return Response(SubmissionDetailsSerializer(submission).data)
