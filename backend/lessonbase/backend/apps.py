from django.apps import AppConfig
from django.db.models.signals import post_migrate
from datetime import timedelta
from django.utils import timezone
import random


def create_required_objects(sender, **kwargs):
    from apps.subjects.models import Subject
    from apps.user_accounts.models import Student, Teacher
    from apps.user_accounts.models import CustomAccount
    from apps.classes.models import ClassEvent
    from apps.assignments.models import (
        Assignment,
        AssignmentAttempt,
        Feedback,
    )
    from apps.user_accounts.models import ClassGroup

    # Loop now unpacks name, code, and color
    for name, code, color in Subject.reserved_names:
        # Use get_or_create with name and code for uniqueness check
        subject, created = Subject.objects.get_or_create(name=name)
        subject.code = code
        subject.color = color
        subject.save()

    # Create 20 random students
    first_names = [
        "James",
        "Mary",
        "John",
        "Patricia",
        "Robert",
        "Jennifer",
        "Michael",
        "Linda",
        "William",
        "Barbara",
        "David",
        "Elizabeth",
        "Richard",
        "Susan",
        "Joseph",
        "Jessica",
        "Thomas",
        "Sarah",
        "Charles",
        "Karen",
    ]
    last_names = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Rodriguez",
        "Martinez",
        "Hernandez",
        "Lopez",
        "Gonzalez",
        "Wilson",
        "Anderson",
        "Thomas",
        "Taylor",
        "Moore",
        "Jackson",
        "Martin",
    ]

    all_students = []
    for i in range(20):
        student, student_created = Student.objects.get_or_create(
            username=f"student_{i+1}",
            defaults={
                "first_name": first_names[i],
                "last_name": last_names[i],
                "email": f"{first_names[i].lower()}.{last_names[i].lower()}@test.com",
            },
        )
        if student_created:
            student.set_password("student")
            student.save()
        all_students.append(student)

    # Create a teacher
    teacher, teacher_created = Teacher.objects.get_or_create(username="teacher")
    if teacher_created:
        teacher.set_password("teacher")
        teacher.email = "teacher@teacher.com"
        teacher.is_confirmed = True
    teacher.students.add(*all_students)
    teacher.subjects.add(Subject.objects.order_by("?").first())
    teacher.save()

    # Create 5 class groups with overlapping students
    class_groups = []
    for i in range(5):
        class_group, group_created = ClassGroup.objects.get_or_create(
            name=f"Class {i + 1}", class_code=f"C{i + 1}"
        )
        if group_created:
            # Randomly assign 4-8 students to each group to create overlap
            num_students = random.randint(4, 8)
            selected_students = random.sample(all_students, num_students)
            class_group.students.add(*selected_students)
            class_group.teachers.add(teacher)
            subject = Subject.objects.order_by("?").first()
            class_group.subjects.add(subject)
            class_group.save()
        class_groups.append(class_group)

    # Ensure there are at least 5 upcoming classes
    now = timezone.now()
    future_classes = ClassEvent.objects.filter(start_time__gt=now).count()
    classes_to_create = max(0, 5 - future_classes)

    if classes_to_create > 0:
        durations = [45, 60, 90]  # Variety of class durations

        for i in range(classes_to_create):
            # Randomly select 1-5 students from all students
            num_students = random.randint(1, 7)
            selected_students = random.sample(all_students, num_students)

            # Random subject
            subject = Subject.objects.order_by("?").first()

            # Random day in next 14 days, random hour between 9 AM and 5 PM
            random_days = random.randint(1, 14)
            random_hour = random.randint(9, 17)
            start_time = now + timedelta(days=random_days)
            start_time = start_time.replace(hour=random_hour, minute=0)

            # Random duration
            duration = random.choice(durations)

            class_event = ClassEvent.objects.create(
                start_time=start_time,
                duration=duration,
                subject=subject,
                class_group=random.choice(class_groups),
                name=f"Class Event {subject.name} {i + 1}",
            )
            class_event.students.add(*selected_students)
            class_event.teachers.add(teacher)
            class_event.save()

    # Create some assignments
    for i in range(5):
        subject = Subject.objects.order_by("?").first()
        assignment, created = Assignment.objects.get_or_create(
            title=f"Homework {i + 1}",
            description="Please complete the assigned exercises.",
            defaults={
                "max_score": 100,
                "set_date": timezone.now().date() + timedelta(days=i),
                "due_date": timezone.now().date() + timedelta(days=7),
                "subject": subject,
            },
        )
        assignment.teachers.add(teacher)
        # Randomly assign some students to each assignment
        num_students = random.randint(5, 15)
        selected_students = random.sample(all_students, num_students)
        assignment.students.add(*selected_students)
        assignment.save()

        # Create assignment attempts for selected students
        for student in selected_students:
            attempt, created = AssignmentAttempt.objects.get_or_create(
                assignment=assignment,
                student=student,
                defaults={
                    "answer_text": f"My answer to Homework {i + 1}",
                },
            )

            # Provide feedback
            Feedback.objects.create(
                assignmentAttempt=attempt,
                teacher=teacher,
                text=f"Well done, {student.first_name}!",
                score=random.randint(70, 100),
            )

    # Create a superuser
    if not CustomAccount.objects.filter(username="admin").exists():
        CustomAccount.objects.create_superuser(
            username="admin", password="admin", email="admin@example.com"
        )


class MyAppConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "backend"

    def ready(self):
        post_migrate.connect(create_required_objects, sender=self)
