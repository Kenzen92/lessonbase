from datetime import datetime
from rest_framework import serializers
from .models import Subject, Teacher, Student, Staff, ClassEvent, Event, CustomerAccount
from django.contrib.auth import authenticate
import logging
from django.contrib.auth.hashers import make_password
logger = logging.getLogger(__name__)

userModel = CustomerAccount()

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'username', 'first_name', 'last_name', 'enrollment_date']

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class TeacherClassEventSerializer(serializers.ModelSerializer):

    class Meta:
        model = Teacher
        fields = ['username']

class TeacherSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True)

    class Meta:
        model = Teacher
        fields = ['username', 'subjects', 'students']


class ClassEventSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    subject = SubjectSerializer()

    class Meta:
        model = ClassEvent
        fields = ['id', 'start_time', 'duration', 'subject', 'students', 'teachers']
        read_only_fields = ['id']
        
class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

class CustomerAccountSerializer(serializers.ModelSerializer):
    user_type = serializers.ChoiceField(choices=[(1, 'Teacher'), (2, 'Student'), (3, 'Staff')])
    subjects = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), many=True, write_only=True)

    class Meta:
        model = CustomerAccount
        fields = ('id', 'username', 'password', 'user_type', 'subjects')
    

    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        print(username, password)
        try:
            user = CustomerAccount.objects.get(username=username)
        except CustomerAccount.DoesNotExist:
            raise 
        user.get_real_instance()
        print(user)
        validated = user.check_password(password)

        if not validated:
            raise serializers.ValidationError(f'User: {user}, password: {password}, username: {username}, Invalid username or password')

        # You can add additional validation logic here if needed

        return user