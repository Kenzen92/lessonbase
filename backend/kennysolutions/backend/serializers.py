from datetime import datetime
from rest_framework import serializers
from .models import Subject, Teacher, Student, Staff, ClassEvent, Event, CustomerAccount
from django.contrib.auth import authenticate
import logging
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractUser


userModel = CustomerAccount()

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'username', 'first_name', 'last_name', 'enrollment_date']

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name']

class TeacherClassEventSerializer(serializers.ModelSerializer):

    class Meta:
        model = Teacher
        fields = ['username']

class TeacherSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)

    class Meta:
        model = Teacher
        fields = ['id', 'username', 'subjects', 'students', 'first_name', 'last_name', 'email']
        read_only_fields = ['id', 'students']



class ClassEventSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    subject = SubjectSerializer()

    class Meta:
        model = ClassEvent
        fields = ['id', 'start_time', 'duration', 'subject', 'students', 'teachers']
        read_only_fields = ['id']

    def create(self, validated_data):
        subject_data = validated_data.pop('subject')
        subject_instance = Subject.objects.get_or_create(**subject_data)
        class_event_instance = ClassEvent.objects.create(subject=subject_instance, **validated_data)
        return class_event_instance
        
class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

class CustomerAccountSerializer(serializers.ModelSerializer):
    user_type = serializers.ChoiceField(choices=[(1, 'Teacher'), (2, 'Student'), (3, 'Staff')], write_only=True)
    subjects = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), many=True, write_only=True)

    class Meta:
        model = CustomerAccount
        fields = ('id', 'username', 'password', 'user_type', 'subjects')
    

    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password' )
        print(username, password)
        try:
            user = CustomerAccount.objects.get(username=username)
        except CustomerAccount.DoesNotExist:
            raise serializers.ValidationError('Invalid username or password') 
        user.get_real_instance()
        validated = user.check_password(password)

        if not validated:
            raise serializers.ValidationError(f'User: {user}, password: {password}, username: {username}, Invalid username or password')

        # You can add additional validation logic here if needed

        return user
    
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbstractUser
        fields = ['id', 'username', 'first_name', 'last_name', 'email']  # Add any other fields you need
