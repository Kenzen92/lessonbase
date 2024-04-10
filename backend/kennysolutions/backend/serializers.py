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
        fields = ['id', 'username', 'first_name', 'last_name', 'grade', 'enrollment_date']

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = '__all__'#


class ClassEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassEvent
        fields = '__all__'

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

class CustomerAccountSerializer(serializers.ModelSerializer):
    user_type = serializers.ChoiceField(choices=[(1, 'Teacher'), (2, 'Student'), (3, 'Staff')])

    class Meta:
        model = CustomerAccount
        fields = ('id', 'username', 'password', 'user_type')
    

    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        print(username, password)
        user = CustomerAccount.objects.get(username=username)
        user.get_real_instance()
        print(user)
        validated = user.check_password(password)

        if not validated:
            raise serializers.ValidationError(f'User: {user}, password: {password}, username: {username}, Invalid username or password')

        # You can add additional validation logic here if needed

        return user