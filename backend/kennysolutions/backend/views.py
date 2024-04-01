from django.shortcuts import render
from faker import Faker

# Create your views here.
# views.py

from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .models import ClassEvent, Student, Teacher
from .serializers import ClassEventSerializer, LoginSerializer, StudentRegistrationSerializer, TeacherRegistrationSerializer, TeacherSerializer


@api_view(['GET'])
@permission_classes((permissions.AllowAny,))
def getData(request):
    items = ClassEvent.objects.all()
    serializer = ClassEventSerializer(items, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes((permissions.AllowAny,))
def createData(request):
    # Create 5 new teachers using faker
    fake = Faker()
    for _ in range(5):
        teacher = Teacher.objects.create(
            username=fake.user_name(),
            password=fake.password(),
            email=fake.email(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            subject=fake.job(),
            hire_date=fake.date_this_decade(),
            is_teacher=True,
        )

    # Create 5 new students using faker
    for _ in range(5):
        student = Student.objects.create(
            username=fake.user_name(),
            password=fake.password(),
            email=fake.email(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            grade=fake.random_element(elements=('A', 'B', 'C', 'D')),
            enrollment_date=fake.date_this_decade(),
            is_student=True,
        )

    # Create 20 class events using faker
    for _ in range(20):
        class_event = ClassEvent.objects.create(
            name=fake.text(max_nb_chars=50),
            date=fake.date_between(start_date='-30d', end_date='+30d'),
            start_time=fake.date_time(),
            duration=fake.random_int(min=1, max=6),
            subject=fake.random_element(elements=('Math', 'Science', 'History', 'English')),
        )
        # Add random students and teachers to the class event
        for _ in range(fake.random_int(min=1, max=5)):  # Add 1 to 5 random students
            class_event.students.add(Student.objects.order_by('?').first())
        for _ in range(fake.random_int(min=1, max=3)):  # Add 1 to 3 random teachers
            class_event.teachers.add(Teacher.objects.order_by('?').first())

    return Response(200)

@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def teacherRegister(request):
    if request.method == 'POST':
        serializer = TeacherRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            print("Valid")
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def studentRegister(request):
    if request.method == 'POST':
        serializer = StudentRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data.get('username')
        password = serializer.validated_data.get('password')
        # Perform authentication logic here
        return Response({"message": "Successfully logged in"})
    else:
        return Response(serializer.errors, status=400)