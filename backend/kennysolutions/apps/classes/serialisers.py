from datetime import datetime, timezone
from backend.serializers import StudentSerializer, TeacherClassEventSerializer
from rest_framework import serializers
from apps.subjects.models import Subject
from apps.user_accounts.models import CustomUser, CustomerAccount, Teacher, Student, Staff
from apps.classes.models import ClassEvent, Homework
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

class HomeworkSerializer(serializers.ModelSerializer):
    # Use PrimaryKeyRelatedField for ForeignKey and ManyToMany fields to support both read and write operations
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    class_event = serializers.PrimaryKeyRelatedField(queryset=ClassEvent.objects.all())
    teachers = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), many=True)
    assigned_students = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), many=True)

    class Meta:
        model = Homework
        fields = [
            'title',
            'description',
            'subject',
            'teachers',
            'max_score',
            'created_at',
            'class_event',
            'due_date',
            'assigned_students',
            'submission_instructions',
            'is_mandatory'
        ]
    

class AssignHomeworkSerializer(serializers.ModelSerializer):
    # Use PrimaryKeyRelatedField for ForeignKey and ManyToMany fields to support both read and write operations
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    class_event = serializers.PrimaryKeyRelatedField(queryset=ClassEvent.objects.all())
    assigned_students = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), many=True)

    class Meta:
        model = Homework
        fields = [
            'title',
            'description',
            'subject',
            'max_score',
            'created_at',
            'class_event',
            'due_date',
            'assigned_students',
            'submission_instructions',
            'is_mandatory'
        ]
    
    def validate_due_date(self, value):
        """
        Check that the due date is in the future.
        """
        print(value )
        if value < datetime.now().astimezone():
            raise serializers.ValidationError("The due date must be in the future.")
        return value