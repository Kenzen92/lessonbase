import datetime
import uuid
from django.shortcuts import render
from apps.storage.storage_backends import GridFSStorage
from faker import Faker
import logging
logger = logging.getLogger(__name__)

from django.shortcuts import render
from django.contrib.auth import login
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from apps.classes.models import ClassEvent, Homework, TeachingResource
from apps.user_accounts.models import CustomerAccount, Staff, Student, Teacher
from apps.subjects.models import Subject
from apps.classes.serialisers import AssignHomeworkSerializer, ClassEventSerializer, HomeworkSerializer

from django.core.exceptions import ValidationError

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def teacher_statistics(request):
    teacher = Teacher.objects.get(pk = request.user)    
    try:
        current_dateTime = datetime.datetime.now()
        all_past_classes = ClassEvent.objects.filter(start_time__lt=current_dateTime)
        class_count = all_past_classes.count()
        class_duration_total = sum([each_class.duration for each_class in all_past_classes])
        student_count = teacher.students.count()
        return Response({"data": {"class_count": class_count, "class_duration_total": class_duration_total, "student_count": student_count}}, status=status.HTTP_200_OK)
    except Teacher.DoesNotExist:
        return Response({"error": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)
    
    