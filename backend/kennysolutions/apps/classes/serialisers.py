from datetime import datetime, timezone
from backend.serializers import TeacherClassEventSerializer
from apps.user_accounts.serializers import StudentSerializer
from rest_framework import serializers
from apps.subjects.models import Subject
from apps.user_accounts.models import CustomUser, CustomerAccount, Teacher, Student, Staff
from apps.classes.models import Assignment, ClassEvent, TeachingResource
from apps.subjects.serializers import SubjectSerializer
from django.contrib.auth import authenticate
import logging
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractUser


# Define a serializer for the TeachingResource model
class TeachingResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeachingResource
        fields = ['file', 'class_event', 'name']

class ClassEventCreateSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())  # Allow passing subject as an ID
    resources = TeachingResourceSerializer(many=True, read_only=True)

    class Meta:
        model = ClassEvent
        fields = ['id', 'start_time', 'duration', 'subject', 'students', 'teachers', 'resources']
        read_only_fields = ['id']

class ClassEventSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    subject = SubjectSerializer(many=False, read_only=True)
    resources = TeachingResourceSerializer(many=True, read_only=True)

    class Meta:
        model = ClassEvent
        fields = ['id', 'start_time', 'duration', 'subject', 'students', 'teachers', 'resources']
        read_only_fields = ['id']


class AssignmentSerializer(serializers.ModelSerializer):
    # Use PrimaryKeyRelatedField for ForeignKey and ManyToMany fields to support both read and write operations
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    teachers = serializers.PrimaryKeyRelatedField(queryset=Teacher.objects.all(), many=True)

    class Meta:
        model = Assignment
        fields = [
            'title',
            'description',
            'subject',
            'teachers',
            'max_score',
            'created_at',
            'due_date',
            'students',
        ]
