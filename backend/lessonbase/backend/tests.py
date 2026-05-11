from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.test import TestCase, TransactionTestCase, override_settings
from rest_framework.authtoken.models import Token

from lessonbase.asgi import application

TEST_CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}


class UserFixtureMixin:
    def build_users_and_lessons(self):
        self.teacher = self.create_teacher()
        self.student = self.create_student()
        self.teacher.students.add(self.student)
        self.subjects = self.select_subjects()
        self.teacher.subjects.add(*self.subjects)
        self.student.subjects.add(*self.subjects)
        self.lessons = self.create_lessons()

    def create_teacher(self):
        from apps.user_accounts.models import Teacher

        return Teacher.objects.create_user(
            email="teacher@example.com",
            password="password123",
            is_confirmed=True,
            premium_account=True,
            username="test_teacher",
            hire_date="2024-01-01",
        )

    def create_student(self):
        from apps.user_accounts.models import Student

        return Student.objects.create_user(
            email="student@example.com",
            password="password123",
            is_confirmed=True,
            premium_account=True,
            username="test_student",
            enrollment_date="2024-01-01",
        )

    def create_extra_student(
        self,
        username="outsider_student",
        email="outsider@example.com",
    ):
        from apps.user_accounts.models import Student

        return Student.objects.create_user(
            email=email,
            password="password123",
            is_confirmed=True,
            premium_account=True,
            username=username,
            enrollment_date="2024-01-01",
        )

    def select_subjects(self):
        from apps.subjects.models import Subject

        return [
            Subject.objects.create(name=f"Subject {index}") for index in range(1, 4)
        ]

    def create_lessons(self):
        from apps.classes.models import ClassEvent

        lessons = []
        for index in range(3):
            lesson = ClassEvent.objects.create(
                start_time="2024-01-01T10:00:00Z",
                duration=60,
                subject=self.subjects[index],
            )
            lesson.students.add(self.student)
            lesson.teachers.add(self.teacher)
            lessons.append(lesson)
        return lessons


class BaseTestCase(UserFixtureMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.build_users_and_lessons()


class BaseTransactionTestCase(UserFixtureMixin, TransactionTestCase):
    def setUp(self):
        super().setUp()
        self.build_users_and_lessons()


class ChatGroupTestCase(BaseTestCase):
    def test_chat_creation(self):
        from backend.models import Chat

        chat = Chat.objects.create(name="Test Chat")
        chat.participants.add(self.teacher, self.student)
        self.assertEqual(chat.participants.count(), 2)
        self.assertIn(self.teacher, chat.participants.all())
        self.assertIn(self.student, chat.participants.all())

    def test_message_creation(self):
        from backend.models import Chat, Message

        chat = Chat.objects.create(name="Test Chat")
        chat.participants.add(self.teacher, self.student)

        message = Message.objects.create(
            chat=chat,
            sender=self.teacher,
            receiver=self.student,
            content="Hello, this is a test message.",
        )
        self.assertEqual(message.chat, chat)
        self.assertEqual(message.sender, self.teacher)
        self.assertEqual(message.receiver, self.student)
        self.assertEqual(message.content, "Hello, this is a test message.")


@override_settings(CHANNEL_LAYERS=TEST_CHANNEL_LAYERS)
class DirectChatSecurityAndLogicTests(BaseTransactionTestCase):
    def setUp(self):
        super().setUp()
        from backend.models import Chat, Message

        self.chat = Chat.objects.create(name="Teacher Student Chat")
        self.chat.participants.add(self.teacher, self.student)
        self.teacher_token = Token.objects.create(user=self.teacher)
        self.student_token = Token.objects.create(user=self.student)
        self.outsider = self.create_extra_student()
        self.outsider_token = Token.objects.create(user=self.outsider)
        self.message_model = Message

    def test_direct_chat_rejects_anonymous_connections(self):
        async def scenario():
            communicator = WebsocketCommunicator(
                application, f"/ws/direct-chat/{self.chat.id}/"
            )
            connected, close_code = await communicator.connect()
            self.assertFalse(connected)
            self.assertEqual(close_code, 4001)

        async_to_sync(scenario)()

    def test_direct_chat_rejects_non_participants(self):
        async def scenario():
            communicator = WebsocketCommunicator(
                application,
                f"/ws/direct-chat/{self.chat.id}/?token={self.outsider_token.key}",
            )
            connected, close_code = await communicator.connect()
            self.assertFalse(connected)
            self.assertEqual(close_code, 4003)

        async_to_sync(scenario)()

    def test_direct_chat_delivers_and_persists_messages(self):
        async def scenario():
            teacher_socket = WebsocketCommunicator(
                application,
                f"/ws/direct-chat/{self.chat.id}/?token={self.teacher_token.key}",
            )
            student_socket = WebsocketCommunicator(
                application,
                f"/ws/direct-chat/{self.chat.id}/?token={self.student_token.key}",
            )

            teacher_connected, _ = await teacher_socket.connect()
            student_connected, _ = await student_socket.connect()

            self.assertTrue(teacher_connected)
            self.assertTrue(student_connected)

            await teacher_socket.send_json_to({"message": "Hello student"})

            teacher_message = await teacher_socket.receive_json_from()
            student_message = await student_socket.receive_json_from()

            self.assertEqual(teacher_message["message"], "Hello student")
            self.assertEqual(student_message["message"], "Hello student")
            self.assertEqual(student_message["sender"], self.teacher.username)
            self.assertEqual(student_message["sender_id"], self.teacher.id)

            await teacher_socket.disconnect()
            await student_socket.disconnect()

        async_to_sync(scenario)()

        stored_message = self.message_model.objects.get(chat=self.chat)
        self.assertEqual(stored_message.sender_id, self.teacher.id)
        self.assertEqual(stored_message.receiver_id, self.student.id)
        self.assertEqual(stored_message.content, "Hello student")

    def test_direct_chat_replays_history_on_reconnect(self):
        self.message_model.objects.create(
            chat=self.chat,
            sender=self.teacher,
            receiver=self.student,
            content="Earlier message",
        )

        async def scenario():
            communicator = WebsocketCommunicator(
                application,
                f"/ws/direct-chat/{self.chat.id}/?token={self.student_token.key}",
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            replayed_message = await communicator.receive_json_from()
            self.assertEqual(replayed_message["message"], "Earlier message")
            self.assertEqual(replayed_message["sender"], self.teacher.username)

            await communicator.disconnect()

        async_to_sync(scenario)()


@override_settings(CHANNEL_LAYERS=TEST_CHANNEL_LAYERS)
class ClassroomChatSecurityAndLogicTests(BaseTransactionTestCase):
    def setUp(self):
        super().setUp()
        from apps.classes.models import ClassEvent
        from backend.models import ClassroomChatMessage

        self.teacher_token = Token.objects.create(user=self.teacher)
        self.student_token = Token.objects.create(user=self.student)
        self.outsider = self.create_extra_student(
            username="outsider_classroom_student",
            email="outsider-classroom@example.com",
        )
        self.outsider_token = Token.objects.create(user=self.outsider)
        self.classroom = ClassEvent.objects.create(
            name="Live Class",
            start_time="2099-01-01T10:00:00Z",
            duration=60,
            subject=self.subjects[0],
        )
        self.classroom.teachers.add(self.teacher)
        self.classroom.students.add(self.student)
        self.classroom_message_model = ClassroomChatMessage

    def test_classroom_chat_rejects_anonymous_connections(self):
        async def scenario():
            communicator = WebsocketCommunicator(
                application, f"/ws/chat/{self.classroom.access_token}/"
            )
            connected, close_code = await communicator.connect()
            self.assertFalse(connected)
            self.assertEqual(close_code, 4001)

        async_to_sync(scenario)()

    def test_classroom_chat_rejects_users_without_classroom_access(self):
        async def scenario():
            communicator = WebsocketCommunicator(
                application,
                f"/ws/chat/{self.classroom.access_token}/?token={self.outsider_token.key}",
            )
            connected, close_code = await communicator.connect()
            self.assertFalse(connected)
            self.assertEqual(close_code, 4003)

        async_to_sync(scenario)()

    def test_classroom_chat_broadcasts_and_persists_messages(self):
        async def scenario():
            teacher_socket = WebsocketCommunicator(
                application,
                f"/ws/chat/{self.classroom.access_token}/?token={self.teacher_token.key}",
            )
            student_socket = WebsocketCommunicator(
                application,
                f"/ws/chat/{self.classroom.access_token}/?token={self.student_token.key}",
            )

            teacher_connected, _ = await teacher_socket.connect()
            student_connected, _ = await student_socket.connect()

            self.assertTrue(teacher_connected)
            self.assertTrue(student_connected)

            await teacher_socket.send_json_to({"message": "Welcome to class"})

            teacher_message = await teacher_socket.receive_json_from()
            student_message = await student_socket.receive_json_from()

            self.assertEqual(teacher_message["message"], "Welcome to class")
            self.assertEqual(student_message["message"], "Welcome to class")
            self.assertEqual(student_message["sender"], self.teacher.username)
            self.assertEqual(student_message["sender_id"], self.teacher.id)

            await teacher_socket.disconnect()
            await student_socket.disconnect()

        async_to_sync(scenario)()

        stored_message = self.classroom_message_model.objects.get(
            classroom=self.classroom
        )
        self.assertEqual(stored_message.sender_id, self.teacher.id)
        self.assertEqual(stored_message.content, "Welcome to class")

    def test_classroom_chat_replays_history_on_reconnect(self):
        self.classroom_message_model.objects.create(
            classroom=self.classroom,
            sender=self.teacher,
            content="Earlier classroom note",
        )

        async def scenario():
            communicator = WebsocketCommunicator(
                application,
                f"/ws/chat/{self.classroom.access_token}/?token={self.student_token.key}",
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            replayed_message = await communicator.receive_json_from()
            self.assertEqual(replayed_message["message"], "Earlier classroom note")
            self.assertEqual(replayed_message["sender"], self.teacher.username)

            await communicator.disconnect()

        async_to_sync(scenario)()
