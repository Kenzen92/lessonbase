from datetime import datetime
from rest_framework import serializers
from .models import Subject, Teacher, Student, Staff, ClassEvent, Event, CustomerAccount
from django.contrib.auth import authenticate


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
    # Define a list field for subjects
    subjects = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), many=True, required=False)

    class Meta:
        model = Teacher
        fields = ['username', 'password', 'email', 'subjects']

    def create(self, validated_data):
        subjects_data = validated_data.pop('subjects', [])
        teacher = Teacher.objects.create(**validated_data, hire_date=datetime.now().date())

        # Associate subjects with the teacher
        for subject in subjects_data:
            teacher.subjects.add(subject)
        
        return teacher
    
class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Student
        fields = ['username', 'password', 'email']

    def create(self, validated_data):
        user = Student.objects.create(**validated_data, enrollment_date=datetime.now().date())
        return user
    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        print("____________________________________")
        print(username)
        print(password)

        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError('Invalid username or password')

        # You can add additional validation logic here if needed

        return data