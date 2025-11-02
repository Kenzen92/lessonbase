from datetime import date
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.subjects.models import Subject
from apps.user_accounts.models import ClassGroup, CustomUser
from apps.storage.storage_backends import GridFSStorage  # Ensure this is your GridFS storage backend

class Event(models.Model):
    name = models.CharField(max_length=100, null=True)

    def __str__(self):
        return self.name


class ClassEvent(Event):
    start_time = models.DateTimeField(null=False)
    duration = models.PositiveSmallIntegerField(
        null=False,
        validators=[MinValueValidator(1), MaxValueValidator(180)],  # Duration in minutes, limited to 1 to 180
        help_text="Duration of the class in minutes."
    )
    students = models.ManyToManyField(CustomUser, related_name='class_events_as_student', blank=True)
    class_group = models.ForeignKey(ClassGroup, on_delete=models.CASCADE, null=True, blank=True)
    teachers = models.ManyToManyField(CustomUser, related_name='class_events_as_teacher', blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_created=True, auto_now=True)

    def __str__(self):
        return f"{self.subject} - {self.start_time} - {self.duration}"


class TeachingResource(models.Model):
    """
    A teaching resource represents a file or URL link to a resource related to a subject.
    Teachers upload these resources for their students to access.
    """
    name = models.CharField(max_length=200, help_text="Name of the resource.", null=True)
    description = models.TextField(max_length=500, blank=True, help_text="Brief description of the resource.", null=True)
    file = models.FileField(upload_to='resources/', blank=True, null=True, help_text="Upload a file for the resource.")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, help_text="The subject to which this resource belongs.")
    upload_date = models.DateTimeField(auto_now_add=True)
    class_event = models.ForeignKey(ClassEvent, on_delete=models.CASCADE, related_name='resources')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._meta.get_field('file').storage = GridFSStorage()

    def __str__(self):
        return self.name



