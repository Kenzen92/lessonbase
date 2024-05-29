import uuid
from django.shortcuts import render
from faker import Faker
import logging
logger = logging.getLogger(__name__)

from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import login
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .models import ClassEvent, CustomerAccount, Staff, Student, Subject, Teacher, Chat, Message
from .serializers import ClassEventSerializer, LoginSerializer, CustomerAccountSerializer, StudentSerializer, SubjectSerializer, TeacherSerializer, ChatSerializer, MessageSerializer
from datetime import datetime
from django.core.mail import send_mail
from django.http import HttpResponse
from django.conf import settings
from django.template.loader import render_to_string


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
def userRegister(request):
    serializer = CustomerAccountSerializer(data=request.data)
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
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid(raise_exception=True):
        token, created = Token.objects.get_or_create(user=serializer.validated_data)
        return Response({"account_type": f"{serializer.validated_data.polymorphic_ctype.model}", "Token": f"{token}", "id": f"{serializer.validated_data.id}"}, status=status.HTTP_200_OK)
    else:
        logger.debug(serializer.errors)
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
    serializer = TeacherSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def students_for_teacher(request):
    queryset = Student.objects.filter(teacher=request.user.id)
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
    
    

@api_view(['GET', 'POST', 'DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def class_events(request, class_id=None):
    if request.method == 'GET':
        user = request.user
        class_events = ClassEvent.objects.filter(students=user) | ClassEvent.objects.filter(teachers=user)
        serializer = ClassEventSerializer(class_events, many=True)
        return Response(serializer.data)

    
    elif request.method == 'DELETE':
        try:
            class_event = ClassEvent.objects.get(id=class_id)
            class_event.delete()
            return Response({'message': 'Class event deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except ClassEvent.DoesNotExist:
            return Response({'error': 'Class event not found'}, status=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'POST':
        teacher_ids = [request.user.pk]
        student_ids = request.data.get('students', [])

        teachers = Teacher.objects.filter(pk__in=teacher_ids)
        students = Student.objects.filter(pk__in=student_ids)

        # subject = request.data.pop('subject')
        # print(subject)
        # try:
        #     subject_instance = Subject.objects.get(id=subject['id'])
        # except Subject.DoesNotExist:
        #     return Response({'message': 'Subject found'}, status=status.HTTP_404_NOT_FOUND)

        # request.data['subject'] = subject_instance
        serializer = ClassEventSerializer(data=request.data)
        if serializer.is_valid():
            class_event = serializer.save()
            class_event.teachers.set(teachers)
            class_event.students.set(students)
            return Response({"message": "Class event created successfully"}, status=status.HTTP_201_CREATED)
        else:
            print(serializer.errors)
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    else:
        return Response({'message': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['GET', 'POST'])    
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def subjects(request):
    user = request.user.get_real_instance()
    if request.method == 'POST':
        subjects_ids = request.data.get('subjects', [])
        try:    
            # If subjects array is empty, remove all subjects from the user
            if not subjects_ids:
                user.subjects.clear()
                return Response({'message': 'All subjects removed from the user'}, status=status.HTTP_200_OK)
            
            # Filter subjects to retain only those present in the request data
            valid_subjects = Subject.objects.filter(id__in=subjects_ids)
            
            # Remove subjects not present in the request data
            user.subjects.remove(*user.subjects.exclude(id__in=valid_subjects.values_list('id', flat=True)))
            
            # Add subjects not already connected to the user
            user.subjects.add(*valid_subjects.exclude(id__in=user.subjects.values_list('id', flat=True)))
            
            return Response({'message': 'User subjects updated successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    else:
        user = user.get_real_instance()
        subjects = user.subjects.all()
        serializer = SubjectSerializer(instance=subjects, many=True)  # Use 'instance' instead of 'data'
        return Response(serializer.data)
    

@api_view(['GET'])    
@permission_classes([AllowAny])
def all_subjects(request):
    subjects = Subject.objects.all()
    serializer = SubjectSerializer(instance=subjects, many=True)  # Use 'instance' instead of 'data'
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == 'GET':
        user = request.user.get_real_instance()
        print(user.polymorphic_ctype.name)
        if user.polymorphic_ctype.name == "teacher":
            serializer = TeacherSerializer(instance=user)
        else:
            serializer = StudentSerializer(instance=user)
        
        return Response(serializer.data)
    elif request.method == 'POST':
        user = request.user.get_real_instance()
        print(request.data)
        if user.polymorphic_ctype.name == "teacher":
            print("ubdating teacher!")
            serializer = TeacherSerializer(instance=user, data=request.data)
        else:
            print("updating student?!")
            serializer = StudentSerializer(instance=user, data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            print("sdata!" ,serializer.data)
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
    msg_plain = render_to_string('invitation_email.txt', {'token': token})
    msg_html = render_to_string('invitation_email.html', {'token': token})
    subject = 'Here is your invitation to join Kennysolutions'
    
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
            account = CustomerAccount.objects.get(confirmation_token=token)
        except CustomerAccount.DoesNotExist:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
       
        return render(request, "student_account_signup.html", {"token": token, confirm_account: "http://localhost:8000/confirm_account/"})
    elif request.method == 'POST':
        if request.data['username'] and request.data['password1']:
            token=request.data.get('token')
            print(token ) 
            try:
                account = CustomerAccount.objects.get(confirmation_token=token)
            except CustomerAccount.DoesNotExist:
                return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
            
            account.username=request.data['username']
            account.set_password(request.data['password1'])
            account.save()
            account.confirmation_token = None # clear the token
            # Perform any additional actions here like redirecting to a success page, etc.
            return render(request, "account_confirmation.html")
        else:
            return Response({"error": "No username or password"}, status=status.HTTP_400_BAD_REQUEST)
        


class ChatListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Chat.objects.filter(participants=self.request.user)

    def perform_create(self, serializer):
        chat = serializer.save()
        user_ids = self.request.data.get('participants', [])  # Ensure this is a list
        print(f"User IDs to add: {user_ids}")

        # Add the current user to the chat
        chat.participants.add(self.request.user)
        
        # Add other participants
        if user_ids:
            for each_id in user_ids:
                try:
                    other_user = CustomerAccount.objects.get(id=each_id)
                    print("Added the other user yo: ", other_user)
                    chat.participants.add(other_user)
                except CustomerAccount.DoesNotExist:
                    print(f"User with ID {each_id} does not exist ")
        
        chat.save()

        # Debug prints
        print(f"Chat created with participants: {[participant.id for participant in chat.participants.all()]}")
        print(f"Chat participants (excluding current user): {[participant.id for participant in chat.participants.exclude(id=self.request.user.id)]}")

        # Return success response
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        chat_id = self.kwargs['chat_id']
        return Message.objects.filter(chat_id=chat_id, chat__participants=self.request.user)

    def perform_create(self, serializer):
        chat_id = self.kwargs['chat_id']
        print("Creating chat with id: ", chat_id )
        serializer.save(sender=self.request.user, chat_id=chat_id)