from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.subjects.models import Subject
from apps.user_accounts.models import CustomUser
from django.core.exceptions import ValidationError
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
    teachers = models.ManyToManyField(CustomUser, related_name='class_events_as_teacher', blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class TeachingResource(models.Model):
    """
    A teaching resource represents a file or URL link to a resource related to a subject.
    Teachers upload these resources for their students to access.
    """
    name = models.CharField(max_length=200, help_text="Name of the resource.")
    description = models.TextField(max_length=500, blank=True, help_text="Brief description of the resource.")
    file = models.FileField(upload_to='resources/', blank=True, null=True, help_text="Upload a file for the resource.")
    url = models.URLField(blank=True, null=True, help_text="URL to an online resource.")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, help_text="The subject to which this resource belongs.")
    upload_date = models.DateTimeField(auto_now_add=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._meta.get_field('file').storage = GridFSStorage()

    def __str__(self):
        return self.name

    def clean(self):
        if not self.file and not self.url:
            raise ValidationError("Either a file or a URL must be provided for the resource.")
        if self.file and self.url:
            raise ValidationError("Please provide only a file or a URL, not both.")


class Assignment(models.Model):
    """
    An assignment represents any work given by a teacher to students. Assignments are connected to a specific subject.
    """
    title = models.CharField(null=False, max_length=200, help_text="Title of the assignment.")
    description = models.TextField(max_length=1000, help_text="Detailed description of the assignment.")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, help_text="The subject to which this assignment belongs.")
    teachers = models.ManyToManyField(CustomUser, related_name='assignments_as_teacher', help_text="Teachers assigning this work.")
    max_score = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Maximum score that can be achieved for this assignment."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.subject.name}"


class Homework(Assignment):
    """
    Homework is a specific type of assignment tied to a particular class event. It is time-sensitive and associated with students.
    """
    class_event = models.ForeignKey(ClassEvent, on_delete=models.CASCADE, help_text="The class event associated with this homework.")
    due_date = models.DateTimeField(
        help_text="The deadline for the homework.",
        validators=[MinValueValidator(timezone.now())]  # Ensures the due date is in the future
    )
    assigned_students = models.ManyToManyField(CustomUser, related_name='homework_assignments', blank=True)
    submission_instructions = models.TextField(max_length=1000, blank=True, help_text="Instructions on how to submit the homework.")
    is_mandatory = models.BooleanField(default=True, help_text="Indicates if the homework is mandatory.")

    def __str__(self):
        return f"{self.title} for {self.class_event.name}"
