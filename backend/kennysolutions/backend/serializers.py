from datetime import datetime
from rest_framework import serializers
from .models import Teacher, Student, Staff, ClassEvent, Event, CustomerAccount


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

class TeacherRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Teacher
        fields = ['username', 'password', 'email']

    def create(self, validated_data):
        user = Teacher.objects.create(**validated_data, hire_date=datetime.now().date())
        return user
    
class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Student
        fields = ['username', 'password', 'email']

    def create(self, validated_data):
        user = Student.objects.create(**validated_data, enrollment_date=datetime.now().date())
        return user