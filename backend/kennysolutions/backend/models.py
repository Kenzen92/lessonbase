import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from polymorphic.models import PolymorphicModel
from polymorphic.managers import PolymorphicManager
from django.contrib.auth.models import BaseUserManager


class Subject(models.Model):
    name = models.CharField(max_length=100)

   
class CustomUser(AbstractUser):
    password_reset_token = models.UUIDField(null=True, default=uuid.uuid4)
    groups = models.ManyToManyField('auth.Group', related_name='custom_users', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='custom_users', blank=True)

class CustomerAccountManager(PolymorphicManager):
    def get_by_natural_key(self, username):
        return self.get(username=username)
    
    def create_user(self, email=None, username=None, password=None, **extra_fields):
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, username=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, username, password, **extra_fields)


class CustomerAccount(PolymorphicModel, CustomUser):
    objects = CustomerAccountManager()
    is_confirmed = models.BooleanField(null=False, default=False)
    premium_account = models.BooleanField(null=False, default=False)

    def __str__(self):
        return f"{self.username} is a {self.polymorphic_ctype}"
 

class Student(CustomerAccount):
    enrollment_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.username

class Teacher(CustomerAccount):
    subjects = models.ManyToManyField(Subject)
    hire_date = models.DateField(null=True)
    students = models.ManyToManyField(Student)

    def __str__(self):
        return self.username

class Staff(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True, related_name="staff_user")
    department = models.CharField(max_length=100)

    def __str__(self):
        return self.user.username

class Event(models.Model):
    name = models.CharField(max_length=100, null=True)


    def __str__(self):
        return self.name

class ClassEvent(Event):
    start_time = models.DateTimeField(null=False)
    duration = models.PositiveSmallIntegerField(null=False)
    students = models.ManyToManyField(CustomUser, related_name='class_events_as_student', blank=True)
    teachers = models.ManyToManyField(CustomUser, related_name='class_events_as_teacher', blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)  # Change to ForeignKey field

    def __str__(self):
        return self.name
    




