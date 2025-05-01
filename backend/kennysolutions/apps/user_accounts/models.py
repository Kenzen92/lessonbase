from apps.storage.storage_backends import GridFSStorage
from polymorphic.models import PolymorphicModel
from polymorphic.managers import PolymorphicManager
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.subjects.models import Subject

class CustomUser(AbstractUser):
    password_reset_token = models.UUIDField(null=True, default=uuid.uuid4)
    groups = models.ManyToManyField('auth.Group', related_name='custom_users', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='custom_users', blank=True)

class CustomAccountManager(PolymorphicManager):
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
    
    def normalize_email(self, email):
        return email.lower()


class CustomAccount(PolymorphicModel, CustomUser):
    objects = CustomAccountManager()
    is_confirmed = models.BooleanField(null=False, default=False)
    premium_account = models.BooleanField(null=False, default=False)
    confirmation_token = models.UUIDField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    subjects = models.ManyToManyField(Subject)

    def save(self, *args, **kwargs):
            if self.profile_picture:
                self.profile_picture.storage = GridFSStorage(collection='profile_pictures')
            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} is a {self.polymorphic_ctype.name}"
    
 

class Student(CustomAccount):
    enrollment_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.username

class Teacher(CustomAccount):
    hire_date = models.DateField(null=True)
    students = models.ManyToManyField(Student)

    def __str__(self):
        return self.username

class Staff(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True, related_name="staff_user")
    department = models.CharField(max_length=100)

    def __str__(self):
        return self.user.username

class ClassGroup(models.Model):
    teachers = models.ManyToManyField(Teacher, related_name="class_groups")
    students = models.ManyToManyField(Student, related_name="class_groups")
    name = models.CharField(max_length=255, null=False)
    description = models.TextField(null=True, blank=True)
    subjects = models.ManyToManyField(Subject, related_name="class_groups")
    location = models.CharField(max_length=255, null=True, blank=True)
    class_code = models.CharField(max_length=50, unique=True)
    max_students = models.PositiveIntegerField(null=True, blank=True)
    symbol = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('canceled', 'Canceled'),
        ('archived', 'Archived'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    year = models.IntegerField(null=True, blank=True)
    term = models.CharField(max_length=20, null=True, blank=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name="created_class_groups")
    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.symbol:
            self.symbol.storage = GridFSStorage(collection='profile_pictures')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
