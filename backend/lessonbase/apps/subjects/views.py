from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from apps.subjects.models import Subject
from apps.subjects.serializers import SubjectSerializer


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def subjects(request):
    user = request.user.get_real_instance()
    subjects = user.subjects.all()
    serializer = SubjectSerializer(
        instance=subjects, many=True
    )  # Use 'instance' instead of 'data'
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def all_subjects(request):
    subjects = Subject.objects.all()
    serializer = SubjectSerializer(
        instance=subjects, many=True
    )  # Use 'instance' instead of 'data'
    return Response(serializer.data)
