from django.test import TestCase


# Create your tests here.
class BaseTestCase(TestCase):
    def setUp(self):

        self.teacher = self.create_teacher()
        self.student = self.create_student()
        self.teacher.students.add(self.student)
        self.subjects = self.select_subjects()
        self.teacher.subjects.add(*self.subjects)
        self.student.subjects.add(*self.subjects)
        self.lessons = self.create_lessons()

    def create_teacher(self):
        from apps.user_accounts.models import Teacher

        teacher = Teacher.objects.create_user(
            email="teacher@example.com",
            is_confirmed=True,
            premium_account=True,
            username="test_teacher",
            hire_date="2024-01-01",
        )
        return teacher

    def create_student(self):
        from apps.user_accounts.models import Student

        student = Student.objects.create_user(
            email="student@example.com",
            is_confirmed=True,
            premium_account=True,
            username="test_student",
            enrollment_date="2024-01-01",
        )
        return student

    def select_subjects(self):
        from apps.subjects.models import Subject

        subjects = Subject.objects.order_by("?")[:3]
        return subjects

    def create_lessons(self):
        from apps.classes.models import ClassEvent

        lessons = []
        for i in range(3):
            lesson = ClassEvent.objects.create(
                start_time="2024-01-01T10:00:00Z",
                duration=60,
                subject=self.subjects[i],
            )
            lesson.students.add(self.student)
            lesson.teachers.add(self.teacher)
            lessons.append(lesson)
        return lessons
