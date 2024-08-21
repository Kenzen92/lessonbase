import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.subjects.models import Subject
from apps.user_accounts.models import CustomUser, CustomerAccount

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
    

class Chat(models.Model):
    participants = models.ManyToManyField(CustomerAccount)
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=100)

class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    sender = models.ForeignKey(CustomerAccount, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(CustomerAccount, related_name='received_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)


