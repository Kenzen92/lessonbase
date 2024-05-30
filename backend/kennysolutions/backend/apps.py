from django.apps import AppConfig
from django.db.models.signals import post_migrate

def create_required_objects(sender, **kwargs):
    from .models import Subject, Student, Teacher
    for name in Subject.reserved_names:
        Subject.objects.get_or_create(name=name)

    student, created = Student.objects.get_or_create(username="student")
    student.set_password("student")
    teacher, created = Teacher.objects.get_or_create(username="teacher")
    teacher.students.add(student)
    teacher.save()
    student.save()

class MyAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend'

    def ready(self):
        post_migrate.connect(create_required_objects, sender=self)

