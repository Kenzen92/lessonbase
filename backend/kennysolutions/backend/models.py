import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from polymorphic.models import PolymorphicModel
from polymorphic.managers import PolymorphicManager


class Subject(models.Model):
    name = models.CharField(max_length=100)

class CustomUser(AbstractUser):
    password_reset_token = models.UUIDField(null=True, default=uuid.uuid4)
    groups = models.ManyToManyField('auth.Group', related_name='custom_users', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='custom_users', blank=True)

class CustomerAccount(PolymorphicModel, CustomUser):
    objects = PolymorphicManager()
    is_confirmed = models.BooleanField(null=False, default=False)
    premium_account = models.BooleanField(null=False, default=False)

    def __str__(self):
        return f"{self.username} is a {self.polymorphic_ctype}"

class Student(CustomerAccount):
    grade = models.CharField(max_length=10)
    enrollment_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.username

class Teacher(CustomerAccount):
    subjects = models.ManyToManyField(Subject)
    hire_date = models.DateField()

    def __str__(self):
        return self.username

class Staff(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True, related_name="staff_user")
    department = models.CharField(max_length=100)

    def __str__(self):
        return self.user.username

class Event(models.Model):
    name = models.CharField(max_length=100)
    date = models.DateField()

    def __str__(self):
        return self.name

class ClassEvent(Event):
    start_time = models.DateTimeField(null=False)
    duration = models.PositiveSmallIntegerField(null=False)
    students = models.ManyToManyField(CustomUser, related_name='class_events_as_student', blank=True)
    teachers = models.ManyToManyField(CustomUser, related_name='class_events_as_teacher', blank=True)
    subject = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    




