from django.db import models

from apps.subjects.models import Subject
from apps.user_accounts.models import CustomUser

# Create your models here.
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