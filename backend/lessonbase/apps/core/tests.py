from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.test import TestCase, TransactionTestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from config.asgi import application

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
        from apps.tags.utils import add_tag

        lessons = []
        for index in range(3):
            lesson = ClassEvent.objects.create(
                start_time="2024-01-01T10:00:00Z",
                duration=60,
            )
            add_tag(lesson, self.subjects[index].name, kind="subject")
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
        from apps.core.models import Chat

        chat = Chat.objects.create(name="Test Chat")
        chat.participants.add(self.teacher, self.student)
        self.assertEqual(chat.participants.count(), 2)
        self.assertIn(self.teacher, chat.participants.all())
        self.assertIn(self.student, chat.participants.all())

    def test_post_chats_creates_chat_with_participants(self):
        # Regression: production POST /chats/ returned 500 because
        # backend_chat.id was bigint while the model declared UUIDField
        # (migration 0005 was a no-op against an edited 0001_initial).
        # Exercising the real endpoint catches model/schema drift on a
        # freshly migrated test DB.
        from apps.core.models import Chat

        token = Token.objects.create(user=self.teacher)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = client.post(
            "/chats/",
            {"participants": [self.student.id]},
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(Chat.objects.count(), 1)
        chat = Chat.objects.get()
        self.assertSetEqual(
            set(chat.participants.values_list("id", flat=True)),
            {self.teacher.id, self.student.id},
        )

    def test_message_creation(self):
        from apps.core.models import Chat, Message

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
        from apps.core.models import Chat, Message

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
        from apps.core.models import ClassroomChatMessage

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


@override_settings(CHANNEL_LAYERS=TEST_CHANNEL_LAYERS)
class WhiteboardSceneSyncTests(BaseTransactionTestCase):
    """Excalidraw scene sync: snapshot on connect, reconciled broadcasts,
    version-rule rejection of stale edits. Scene state lives in Redis keyed by
    the classroom's (random) access token, so tests are isolated per classroom."""

    def setUp(self):
        super().setUp()
        from apps.classes.models import ClassEvent

        self.teacher_token = Token.objects.create(user=self.teacher)
        self.student_token = Token.objects.create(user=self.student)
        self.outsider = self.create_extra_student(
            username="outsider_whiteboard_student",
            email="outsider-whiteboard@example.com",
        )
        self.outsider_token = Token.objects.create(user=self.outsider)
        self.classroom = ClassEvent.objects.create(
            name="Whiteboard Class",
            start_time="2099-01-01T10:00:00Z",
            duration=60,
        )
        self.classroom.teachers.add(self.teacher)
        self.classroom.students.add(self.student)

    def _ws_path(self, token=None):
        suffix = f"?token={token}" if token else ""
        return f"/ws/whiteboard/{self.classroom.access_token}/{suffix}"

    @staticmethod
    def _element(el_id, version=1, version_nonce=100, **extra):
        return {
            "id": el_id,
            "type": "rectangle",
            "version": version,
            "versionNonce": version_nonce,
            "isDeleted": False,
            "index": "a1",
            **extra,
        }

    def test_whiteboard_rejects_anonymous_connections(self):
        async def scenario():
            communicator = WebsocketCommunicator(application, self._ws_path())
            connected, close_code = await communicator.connect()
            self.assertFalse(connected)
            self.assertEqual(close_code, 4001)

        async_to_sync(scenario)()

    def test_whiteboard_rejects_users_without_classroom_access(self):
        async def scenario():
            communicator = WebsocketCommunicator(
                application, self._ws_path(self.outsider_token.key)
            )
            connected, close_code = await communicator.connect()
            self.assertFalse(connected)
            self.assertEqual(close_code, 4003)

        async_to_sync(scenario)()

    def test_scene_update_broadcasts_and_snapshots_to_late_joiner(self):
        async def scenario():
            teacher_socket = WebsocketCommunicator(
                application, self._ws_path(self.teacher_token.key)
            )
            connected, _ = await teacher_socket.connect()
            self.assertTrue(connected)

            snapshot = await teacher_socket.receive_json_from()
            self.assertEqual(snapshot["type"], "scene_snapshot")
            self.assertEqual(snapshot["payload"]["elements"], [])

            student_socket = WebsocketCommunicator(
                application, self._ws_path(self.student_token.key)
            )
            connected, _ = await student_socket.connect()
            self.assertTrue(connected)
            await student_socket.receive_json_from()  # student's empty snapshot

            element = self._element("rect-1")
            await teacher_socket.send_json_to(
                {"type": "scene_update", "payload": {"elements": [element]}}
            )

            broadcast = await student_socket.receive_json_from()
            self.assertEqual(broadcast["type"], "scene_update")
            self.assertEqual(broadcast["payload"]["elements"][0]["id"], "rect-1")

            # Sender must not receive an echo.
            self.assertTrue(await teacher_socket.receive_nothing())

            # A fresh connection gets the element in its snapshot.
            late_socket = WebsocketCommunicator(
                application, self._ws_path(self.student_token.key)
            )
            connected, _ = await late_socket.connect()
            self.assertTrue(connected)
            late_snapshot = await late_socket.receive_json_from()
            self.assertEqual(late_snapshot["type"], "scene_snapshot")
            ids = [el["id"] for el in late_snapshot["payload"]["elements"]]
            self.assertIn("rect-1", ids)

            await teacher_socket.disconnect()
            await student_socket.disconnect()
            await late_socket.disconnect()

        async_to_sync(scenario)()

    def test_stale_versions_are_rejected_not_broadcast(self):
        async def scenario():
            teacher_socket = WebsocketCommunicator(
                application, self._ws_path(self.teacher_token.key)
            )
            student_socket = WebsocketCommunicator(
                application, self._ws_path(self.student_token.key)
            )
            await teacher_socket.connect()
            await student_socket.connect()
            await teacher_socket.receive_json_from()  # snapshot
            await student_socket.receive_json_from()  # snapshot

            await teacher_socket.send_json_to(
                {
                    "type": "scene_update",
                    "payload": {"elements": [self._element("rect-2", version=5)]},
                }
            )
            first = await student_socket.receive_json_from()
            self.assertEqual(first["payload"]["elements"][0]["version"], 5)

            # A stale edit (lower version) must be dropped server-side.
            await teacher_socket.send_json_to(
                {
                    "type": "scene_update",
                    "payload": {"elements": [self._element("rect-2", version=3)]},
                }
            )
            self.assertTrue(await student_socket.receive_nothing())

            # The newer version survives in the snapshot.
            late_socket = WebsocketCommunicator(
                application, self._ws_path(self.teacher_token.key)
            )
            await late_socket.connect()
            late_snapshot = await late_socket.receive_json_from()
            stored = {
                el["id"]: el for el in late_snapshot["payload"]["elements"]
            }
            self.assertEqual(stored["rect-2"]["version"], 5)

            await teacher_socket.disconnect()
            await student_socket.disconnect()
            await late_socket.disconnect()

        async_to_sync(scenario)()
