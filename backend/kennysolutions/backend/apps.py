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
    from apps.assignments.models import Assignment, AssignmentAttempt, Feedback


    # Loop now unpacks name, code, and color
    for name, code, color in Subject.reserved_names:
        # Use get_or_create with name and code for uniqueness check
        subject, created = Subject.objects.get_or_create(name=name)
        subject.code = code
        subject.color = color
        subject.save()

    # Create some students and a teacher
    student_1, student_1_created = Student.objects.get_or_create(username="student_1", first_name="Jim", last_name="Bob", email="jimbob@test.com")
    if student_1_created:
        student_1.set_password("student")

    student_2, student_2_created = Student.objects.get_or_create(username="student_2", first_name="John", last_name="Babbage", email="jimbob@test.com")
    if student_2_created:
        student_2.set_password("student")
    
    student_3, student_3_created = Student.objects.get_or_create(username="student_3", first_name="Jackie", last_name="Jackson", email="jimbob@test.com")
    if student_3_created:
        student_3.set_password("student")

    teacher, teacher_created = Teacher.objects.get_or_create(username="teacher")
    if teacher_created:
        teacher.set_password("teacher")
    teacher.students.add(student_1, student_2, student_3)
    teacher.subjects.add(Subject.objects.order_by('?').first())
    teacher.save()
    student_1.save()
    student_2.save()
    student_3.save()

    # Ensure there are at least 5 upcoming classes
    now = timezone.now()
    future_classes = ClassEvent.objects.filter(start_time__gt=now).count()
    classes_to_create = max(0, 5 - future_classes)
    
    if classes_to_create > 0:
        # Get all available students
        all_students = [student_1, student_2, student_3]
        durations = [45, 60, 90]  # Variety of class durations
        
        for i in range(classes_to_create):
            # Randomly select 1-3 students
            num_students = random.randint(1, 3)
            selected_students = random.sample(all_students, num_students)
            
            # Random subject
            subject = Subject.objects.order_by('?').first()
            
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
            )
            class_event.students.add(*selected_students)
            class_event.teachers.add(teacher)
            class_event.save()

    # Create some class groups of students and teachers
    from apps.user_accounts.models import ClassGroup
    class_group, group_1_created = ClassGroup.objects.get_or_create(name="Class 1", class_code="C1")
    if group_1_created:
        class_group.students.add(student_1, student_2, student_3)
        class_group.teachers.add(teacher)
        subject = Subject.objects.order_by('?').first()
        class_group.subjects.add(subject)
        class_group.save()
    class_group, group_2_created = ClassGroup.objects.get_or_create(name="Class 2", class_code="C2")
    if group_2_created:
        class_group.students.add(student_1, student_2, student_3)
        class_group.teachers.add(teacher)
        subject = Subject.objects.order_by('?').first()
        class_group.subjects.add(subject)
        class_group.save()

    class_group, group_3_created = ClassGroup.objects.get_or_create(name="Class 3", class_code="C3")
    if group_3_created:
        class_group.students.add(student_1, student_2, student_3)
        class_group.teachers.add(teacher)
        subject = Subject.objects.order_by('?').first()
        class_group.subjects.add(subject)
        class_group.save()

    # Create some assignments
    for i in range(5):
        subject = Subject.objects.order_by('?').first()
        assignment, created = Assignment.objects.get_or_create(
            title=f"Homework {i + 1}",
            description="Please complete the assigned exercises.",
            defaults={
                    "max_score": 100,
                    "set_date": timezone.now().date() + timedelta(days=i),
                    "due_date": timezone.now().date() + timedelta(days=7),
                    "subject": subject,
                }
        )
        assignment.teachers.add(teacher)
        assignment.students.add(student_1, student_2, student_3)
        assignment.save()

        # Create assignment attempts for each student
        for student in [student_1, student_2, student_3]:
            attempt, created = AssignmentAttempt.objects.get_or_create(
                assignment=assignment,
                student=student,
                defaults={
                    "answer_text": f"My answer to Homework {i + 1}",
                }
            )

            # Provide feedback
            Feedback.objects.create(
                assignmentAttempt=attempt,
                teacher=teacher,
                text=f"Well done, {student.first_name}!",
                score=99
            )

    # Create a superuser
    if not CustomAccount.objects.filter(username="admin").exists():
        CustomAccount.objects.create_superuser(
            username="admin",
            password="admin",
            email="admin@example.com"
        )

class MyAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend'

    def ready(self):
        post_migrate.connect(create_required_objects, sender=self)

