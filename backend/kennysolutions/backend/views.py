from faker import Faker
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework import permissions, status, generics
from .models import Chat, Message
from apps.classes.models import ClassEvent
from apps.user_accounts.models import CustomAccount, Student, Teacher
from apps.subjects.models import Subject
from .serializers import ChatSerializer, MessageSerializer

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
            hire_date=fake.date_this_decade(),
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
        )

    # Create 20 class events using faker
    for _ in range(20):
        class_event = ClassEvent.objects.create(
            name=fake.text(max_nb_chars=50),
            start_time=fake.date_time(),
            duration=fake.random_int(min=1, max=6),
            subject=Subject.objects.order_by('?').first()
        )
        # Add random students and teachers to the class event
        for _ in range(fake.random_int(min=1, max=5)):  # Add 1 to 5 random students
            class_event.students.add(Student.objects.order_by('?').first())
        for _ in range(fake.random_int(min=1, max=3)):  # Add 1 to 3 random teachers
            class_event.teachers.add(Teacher.objects.order_by('?').first())

    return Response(200)




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
                    other_user = CustomAccount.objects.get(id=each_id)
                    print("Added the other user yo: ", other_user)
                    chat.participants.add(other_user)
                except CustomAccount.DoesNotExist:
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


