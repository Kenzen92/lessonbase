import json
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Seed deterministic users, direct chat, and classroom chat for browser E2E tests."

    teacher_email = "playwright.teacher@example.com"
    student_email = "playwright.student@example.com"
    teacher_username = "playwright_teacher"
    student_username = "playwright_student"
    password = "Password123!"
    subject_name = "Playwright Subject"
    subject_code = "PWE2E"
    classroom_access_token = "playwright-classroom-chat"
    classroom_name = "Playwright Live Classroom"
    direct_chat_name = "Playwright Direct Chat"

    def handle(self, *args, **options):
        from apps.classes.models import ClassEvent
        from apps.core.models import Chat, ClassroomChatMessage, Message
        from apps.subjects.models import Subject
        from apps.user_accounts.models import Student, Teacher

        Subject.objects.filter(name=self.subject_name).delete()
        subject = Subject.objects.create(
            name=self.subject_name,
            code=self.subject_code,
            color="#1976D2",
        )

        Teacher.objects.filter(username=self.teacher_username).delete()
        Student.objects.filter(username=self.student_username).delete()

        teacher = Teacher.objects.create_user(
            email=self.teacher_email,
            username=self.teacher_username,
            password=self.password,
            first_name="Playwright",
            last_name="Teacher",
            is_confirmed=True,
            premium_account=True,
            hire_date="2024-01-01",
        )
        student = Student.objects.create_user(
            email=self.student_email,
            username=self.student_username,
            password=self.password,
            first_name="Playwright",
            last_name="Student",
            is_confirmed=True,
            premium_account=True,
            enrollment_date="2024-01-01",
        )

        teacher.students.add(student)
        teacher.subjects.add(subject)
        student.subjects.add(subject)

        Chat.objects.filter(name=self.direct_chat_name).delete()
        chat = Chat.objects.create(name=self.direct_chat_name)
        chat.participants.add(teacher, student)
        Message.objects.filter(chat=chat).delete()

        ClassroomChatMessage.objects.filter(
            classroom__access_token=self.classroom_access_token
        ).delete()
        ClassEvent.objects.filter(access_token=self.classroom_access_token).delete()
        classroom = ClassEvent.objects.create(
            name=self.classroom_name,
            start_time=timezone.now() + timedelta(hours=1),
            duration=60,
            subject=subject,
            access_token=self.classroom_access_token,
            is_active=True,
        )
        classroom.teachers.add(teacher)
        classroom.students.add(student)

        payload = {
            "teacher": {
                "id": teacher.id,
                "email": self.teacher_email,
                "password": self.password,
                "username": teacher.username,
            },
            "student": {
                "id": student.id,
                "email": self.student_email,
                "password": self.password,
                "username": student.username,
            },
            "chat": {
                "id": str(chat.id),
                "name": chat.name,
            },
            "classroom": {
                "id": classroom.id,
                "access_token": classroom.access_token,
                "name": classroom.name,
            },
        }

        self.stdout.write(json.dumps(payload))
