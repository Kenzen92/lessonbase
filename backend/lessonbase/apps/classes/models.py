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
        validators=[MinValueValidator(1), MaxValueValidator(180)],
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

    classroom_type = models.CharField(
        max_length=20,
        choices=CLASSROOM_TYPE_CHOICES,
        default="scheduled",
    )
    access_token = models.CharField(
        max_length=64,
        unique=True,
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.access_token:
            self.access_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def is_expired(self):
        if not self.start_time:
            return False
        from datetime import timedelta
        end_time = self.start_time + timedelta(minutes=self.duration)
        grace_period = end_time + timedelta(minutes=30)
        return timezone.now() > grace_period

    def can_access(self, user):
        if not user or not user.is_authenticated:
            return False
        user_id = user.id if hasattr(user, "id") else user.pk
        return (
            self.teachers.filter(id=user_id).exists()
            or self.students.filter(id=user_id).exists()
        )

    def __str__(self):
        return f"{self.subject} - {self.start_time} - {self.duration}"


class SessionFeedback(models.Model):
    class_event = models.ForeignKey(
        ClassEvent, on_delete=models.CASCADE, related_name="session_feedbacks"
    )
    student = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="session_feedbacks"
    )
    rating = models.SmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("class_event", "student")

    def __str__(self):
        return f"{self.student} rated {self.class_event} — {self.rating}/5"
