from datetime import datetime
from backend.serializers import StudentSerializer, TeacherClassEventSerializer
from rest_framework import serializers
from apps.subjects.models import Subject
from apps.user_accounts.models import CustomerAccount, Teacher, Student, Staff
from apps.classes.models import ClassEvent
from django.contrib.auth import authenticate
import logging
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractUser


class ClassEventSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    subject = serializers.SlugRelatedField(slug_field='name', queryset=Subject.objects.all())

    class Meta:
        model = ClassEvent
        fields = ['id', 'start_time', 'duration', 'subject', 'students', 'teachers']
        read_only_fields = ['id']