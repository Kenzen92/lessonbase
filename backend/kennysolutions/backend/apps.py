from django.apps import AppConfig
from django.db.models.signals import post_migrate


def create_required_objects(sender, **kwargs):
    from apps.subjects.models import Subject
    from apps.user_accounts.models import Student, Teacher
    from apps.user_accounts.models import CustomerAccount

    for name in Subject.reserved_names:
        Subject.objects.get_or_create(name=name)

    student, created = Student.objects.get_or_create(username="student")
    student.set_password("student")
    teacher, created = Teacher.objects.get_or_create(username="teacher")
    teacher.set_password("teacher")
    teacher.students.add(student)
    teacher.save()
    student.save()

    # Create a superuser
    if not CustomerAccount.objects.filter(username="admin").exists():
        CustomerAccount.objects.create_superuser(
            username="admin",
            password="admin",
            email="admin@example.com"
        )

class MyAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend'

    def ready(self):
        post_migrate.connect(create_required_objects, sender=self)

