from datetime import date
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.subjects.models import Subject
from apps.user_accounts.models import ClassGroup, CustomUser
import secrets


class Event(models.Model):
    name = models.CharField(max_length=100, null=True)

    def __str__(self):
        return self.name


class ClassEvent(Event):
    CLASSROOM_TYPE_CHOICES = [
        ("scheduled", "Scheduled Class"),
        ("practice", "Practice/Demo Class"),
    ]

    start_time = models.DateTimeField(null=False)
    duration = models.PositiveSmallIntegerField(
        null=False,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(180),
        ],  # Duration in minutes, limited to 1 to 180
        help_text="Duration of the class in minutes.",
    )
    students = models.ManyToManyField(
        CustomUser, related_name="class_events_as_student", blank=True
    )
    class_group = models.ForeignKey(
        ClassGroup, on_delete=models.CASCADE, null=True, blank=True
    )
    teachers = models.ManyToManyField(
        CustomUser, related_name="class_events_as_teacher", blank=True
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_created=True, auto_now=True)

    # New fields for security and lifecycle
    classroom_type = models.CharField(
        max_length=20,
        choices=CLASSROOM_TYPE_CHOICES,
        default="scheduled",
        help_text="Type of classroom: scheduled or practice",
    )
    access_token = models.CharField(
        max_length=64,
        unique=True,
        null=True,
        blank=True,
        help_text="Secure token for classroom access",
    )
    is_active = models.BooleanField(
        default=True, help_text="Whether the classroom is currently active"
    )

    def save(self, *args, **kwargs):
        # Generate secure access token if not present
        if not self.access_token:
            self.access_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def is_expired(self):
        """Check if classroom should be deleted (30 min after end time)"""
        if not self.start_time:
            return False
        from datetime import timedelta

        end_time = self.start_time + timedelta(minutes=self.duration)
        grace_period = end_time + timedelta(minutes=30)
        return timezone.now() > grace_period

    def can_access(self, user):
        """Check if user has access to this classroom"""
        if not user or not user.is_authenticated:
            return False
        # Get the base user ID to handle proxy models (Teacher/Student extending CustomUser)
        user_id = user.id if hasattr(user, "id") else user.pk
        return (
            self.teachers.filter(id=user_id).exists()
            or self.students.filter(id=user_id).exists()
        )

    def __str__(self):
        return f"{self.subject} - {self.start_time} - {self.duration}"


class TeachingResource(models.Model):
    """
    A teaching resource represents a file or URL link to a resource related to a subject.
    Teachers upload these resources for their students to access.
    """

    name = models.CharField(
        max_length=200, help_text="Name of the resource.", null=True
    )
    description = models.TextField(
        max_length=500,
        blank=True,
        help_text="Brief description of the resource.",
        null=True,
    )
    file = models.FileField(
        upload_to="resources/",
        blank=True,
        null=True,
        help_text="Upload a file for the resource.",
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        help_text="The subject to which this resource belongs.",
    )
    upload_date = models.DateTimeField(auto_now_add=True)
    class_event = models.ForeignKey(
        ClassEvent, on_delete=models.CASCADE, related_name="resources"
    )

    def __str__(self):
        return self.name
