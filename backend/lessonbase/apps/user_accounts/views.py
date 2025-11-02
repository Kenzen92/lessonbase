import uuid
from django.conf import settings
from django.shortcuts import render
from apps.storage.storage_backends import GridFSStorage
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from apps.user_accounts.models import ClassGroup, CustomAccount, Staff, Student, Teacher
from .serializers import (
    ClassGroupCreateSerializer, 
    ClassGroupDetailsSerializer, 
    ClassGroupListSerializer, 
    CustomAccountSerializer, 
    LoginSerializer, 
    StudentSerializer, 
    TeacherDetailSerializer, 
    TeacherListSerializer, 
    TeacherUpdateSerializer
    )
from datetime import datetime
from django.template.loader import render_to_string
from django.core.mail import send_mail
from rest_framework import viewsets
BASE_URL = settings.BASE_URL

@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def auth_user(request):
    """
    This view validates the token and returns the basic user info
    to the auth storage context
    """
    user = request.user.get_real_instance()
    if user.polymorphic_ctype.name == "teacher":
        return Response({"user_type": "teacher"}, status=status.HTTP_200_OK)
    else:
        return Response({"user_type": "student"}, status=status.HTTP_200_OK)



# Create a class group API view here to use all the standard http actions directly mapped to the model
class TeacherViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing homework assignments.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.action == 'create':
            return TeacherDetailSerializer
        if self.action == 'update' or self.action == 'partial_update':
            return TeacherUpdateSerializer
        else:
            return TeacherListSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            Teacher.objects.filter(id=user.id)
            .prefetch_related('subjects')
        )
    
    def create(self, request, *args, **kwargs):
        print("creating")
        # Pass the modified data to the serializer
        data = request.data.copy()
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid(raise_exception=True):
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST),
        self.perform_create(serializer)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def list(self, request, *Args, **kwargs):
        """
        Get the queryset of classes and return them
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def update(self, request, *args, **kwargs):
        """
        Update the class group (supports both PUT and PATCH)
        """
        print("updating")
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        serializer = self.get_serializer(instance, data=data, partial=partial)  # Ensure partial updates work

        if not serializer.is_valid(raise_exception=True):
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class StudentViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing homework assignments.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'update' or self.action == 'partial_update':
            return StudentSerializer
        else:
            return StudentSerializer

    def get_queryset(self):
        # cast polymorphic user type to actual instance

        user = self.request.user.get_real_instance()
        if user.polymorphic_ctype.name == "teacher":
            return (
                Student.objects.filter(teacher=user)
                .prefetch_related('class_groups')
            )
        else:
            return (
                Student.objects.filter(id=user.id)
                .prefetch_related('class_groups')
            )
    
    def create(self, request, *args, **kwargs):
        print("creating")
        # Pass the modified data to the serializer
        data = request.data.copy()
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid(raise_exception=True):
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST),
        self.perform_create(serializer)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def list(self, request, *Args, **kwargs):
        """
        Get the queryset of classes and return them
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def update(self, request, *args, **kwargs):
        """
        Update the class group
        """
        print("updating")
        instance = self.get_object()
        data = request.data.copy()
        serializer = self.get_serializer(instance, data=data)
        if not serializer.is_valid(raise_exception=True):
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def userRegister(request):
    print("Request: ", request.data)
    # grab the ID's from the subjects and place them back into the request for the serializer to process
    subject_dicts = request.data['subjects']
    subject_ids = []
    for each_subject in subject_dicts:
        subject_ids.append(each_subject['value'])
    request.data['subjects'] = subject_ids
    serializer = CustomAccountSerializer(data=request.data)
    if serializer.is_valid():
        user_type = serializer.validated_data['user_type']
        # Create an instance of the appropriate subclass
        if user_type == 1:
            user = Teacher.objects.create(username=serializer.validated_data['username'], hire_date=datetime.now())
            subject_ids = serializer.validated_data.get('subjects', [])  # Get list of subject IDs from request data
            user.subjects.add(*subject_ids)  # Add subjects to the user
        elif user_type == 2:
            user = Student.objects.create(username=serializer.validated_data['username'])
        else:
            user = Staff.objects.create(username=serializer.validated_data['username'])
        # Set other common fields (e.g., password)
        user.set_password(serializer.validated_data['password'])
        user.save()
        # Exclude subjects field from response
        serializer_data = serializer.validated_data.copy()
        serializer_data.pop('subjects', None)
        return Response(serializer_data, status=status.HTTP_201_CREATED)
    print(serializer.errors )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid(raise_exception=True):
        user = serializer.validated_data  # This should give you the user instance
        token, created = Token.objects.get_or_create(user=user)
        
        if user.polymorphic_ctype.model == "teacher":
            return Response({"token": f"{token}", 'user_type': "teacher"}, status=status.HTTP_200_OK)
        else:
            return Response({"token": f"{token}", 'user_type': "student"}, status=status.HTTP_200_OK)
    else:
        return Response({"error": f"{serializer.errors}"}, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
    user = request.user
    try:
        # Attempt to retrieve the token associated with the user
        token = Token.objects.get(user=user)
        # Delete the token
        token.delete()
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
    except Token.DoesNotExist:
        # If the token doesn't exist, consider the user as already logged out
        return Response({"error": "User is not logged in"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def students(request):
    queryset = Student.objects.all()
    serializer = StudentSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def teachers(request):
    queryset = Teacher.objects.all()
    serializer = TeacherDetailSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def students_for_teacher(request):
    queryset = Student.objects.filter(teacher=request.user.id).prefetch_related('class_groups')
    serializer = StudentSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def connect_student_teacher(request):
    teacher = request.user.get_real_instance()
    student_ids = request.data.get('students', [])
    students = Student.objects.filter(id__in=student_ids)
    teacher.students.add(*students)
    teacher.save()
    return Response(status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST', 'PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == 'GET':
        user = request.user.get_real_instance()
        if user.polymorphic_ctype.name == "teacher":
            serializer = TeacherDetailSerializer(instance=user)
        else:
            serializer = StudentSerializer(instance=user)
        
        return Response(serializer.data)
    
    elif request.method == 'POST':
        user = request.user.get_real_instance()
        files = request.FILES
        
        # Adjust serializer to handle files
        if user.polymorphic_ctype.name == "teacher":
            serializer = TeacherUpdateSerializer(instance=user, data=request.data)
        else:
            serializer = StudentSerializer(instance=user, data=request.data)
        
        if serializer.is_valid():
            # Save the user instance
            user = serializer.save()
            
            # Handle file uploads and save to GridFS
            for file_key in files:
                uploaded_file = files[file_key]
                
                # Create a GridFSStorage instance
                gridfs_storage = GridFSStorage()  # Pass parameters if necessary
                
                # Save the file to GridFS
                gridfs_storage._save(uploaded_file.name, uploaded_file, context="profile_picture")
            
            return Response(serializer.data)
        else:
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    elif request.method == 'PATCH':
        user = request.user.get_real_instance()
        files = request.FILES
        # Adjust serializer to handle files
        if user.polymorphic_ctype.name == "teacher":
            serializer = TeacherUpdateSerializer(instance=user, data=request.data, partial=True)
        else:
            serializer = StudentSerializer(instance=user, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Save the user instance
            user = serializer.save()
            
            # Handle file uploads and save to GridFS
            for file_key in files:
                uploaded_file = files[file_key]
                
                # Create a GridFSStorage ins    tance
                gridfs_storage = GridFSStorage()
                file_name = gridfs_storage._save(uploaded_file.name, uploaded_file, context='profile_pictures')
                file_url = gridfs_storage.url(file_name)
                serializer.data['profile_picture'] = file_url
            return Response(serializer.data)
        else:
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def new_student(request):
    destination_email = request.data.get('email') # not using for now
    print(destination_email)
    sender_email = settings.DEFAULT_FROM_EMAIL
    # generate a token that is passed in the link url which will be used to validate the request to activate the account 
    token = uuid.uuid4()
    # Create an empty login account with default values, but attach the confirmation token.
    # student = Student.objects.filter(email=destination_email).first()
    student = None
    if student is None:  # If student doesn't exist, create a new one
        student = Student.objects.create(email=destination_email, username=uuid.uuid4()) 
    student.confirmation_token=token # replace any previous token
    teacher = request.user.get_real_instance()
    teacher.students.add(student)
    student.save()
    # No need to specify 'templates' in the path
    msg_plain = render_to_string('invitation_email.txt', {'token': token, 'confirm_account': f"{BASE_URL}/confirm_account/"})
    msg_html = render_to_string('invitation_email.html', {'token': token, 'confirm_account': f"{BASE_URL}/confirm_account/"})
    subject = 'Here is your invitation to join LessonBase'
    
    send_mail(
        subject,
        msg_plain,
        sender_email,
        ['jamespeterkenny@gmail.com'],
        html_message=msg_html,
        fail_silently=False,
    )
    return Response({"Message": 'Email sent successfully!'}, status=status.HTTP_200_OK)



@api_view(['GET', 'POST'])
@permission_classes((permissions.AllowAny,))
def confirm_account(request):
    if request.method == 'GET':
        token = request.GET.get('token')
        try:
            account = CustomAccount.objects.get(confirmation_token=token)
        except CustomAccount.DoesNotExist:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

        return render(request, "student_account_signup.html", {"token": token, "confirm_account": f"{BASE_URL}/confirm_account/"})
    elif request.method == 'POST':
        if request.data['username'] and request.data['password1']:
            token=request.data.get('token')
            try:
                account = CustomAccount.objects.get(confirmation_token=token)
            except CustomAccount.DoesNotExist:
                return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
            
            account.username=request.data['username']
            account.set_password(request.data['password1'])
            account.save()
            account.confirmation_token = None # clear the token
            # Perform any additional actions here like redirecting to a success page, etc.
            return render(request, "account_confirmation.html", {"BASE_URL": BASE_URL})
        else:
            return Response({"error": "No username or password"}, status=status.HTTP_400_BAD_REQUEST)
        

# Create a class group API view here to use all the standard http actions directly mapped to the model
class ClassGroupViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing homework assignments.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'update' or self.action == 'partial_update':
            return ClassGroupCreateSerializer
        elif self.action == 'list':
            return ClassGroupListSerializer
        else:
            return ClassGroupDetailsSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            ClassGroup.objects.filter(teachers=user)
            .prefetch_related('teachers', 'students', 'subjects')
        )
    
    def create(self, request, *args, **kwargs):
        print("creating")
        # Pass the modified data to the serializer
        data = request.data.copy()
        teacher_list = data.get("teachers")
        if not teacher_list:
            data['teachers'] = [self.request.user]
        else:
            data['teachers'].append(self.request.user.pk) if self.request.user.pk not in data['teachers'] else None
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid(raise_exception=True):
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST),
        self.perform_create(serializer)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def list(self, request, *Args, **kwargs):
        """
        Get the queryset of classes and return them
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def update(self, request, *args, **kwargs):
        """
        Update the class group
        """
        print("updating")
        instance = self.get_object()
        data = request.data.copy()
        teacher_list = data.get("teachers")
        if not teacher_list:
            data['teachers'] = [self.request.user]
        else:
            data['teachers'].append(self.request.user.pk) if self.request.user.pk not in data['teachers'] else None
        serializer = self.get_serializer(instance, data=data)
        if not serializer.is_valid(raise_exception=True):
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def partial_update(self, request, *args, **kwargs):
        """
        Update the class group
        """
        print("updating")
        instance = self.get_object()
        data = request.data.copy()
        teacher_list = data.get("teachers")
        if not teacher_list:
            data['teachers'] = [self.request.user]
        else:
            data['teachers'].append(self.request.user.pk) if self.request.user.pk not in data['teachers'] else None
        serializer = self.get_serializer(instance, data=data)
        if not serializer.is_valid(raise_exception=True):
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)