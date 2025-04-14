from datetime import date
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.subjects.models import Subject
from apps.user_accounts.models import ClassGroup, CustomUser, Student
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



class Assignment(models.Model):
    """
    An assignment represents any work given by a teacher to students. Assignments are connected to a specific subject.
    """
    title = models.CharField(null=False, max_length=200, help_text="Title of the assignment.")
    description = models.TextField(max_length=1000, help_text="Detailed description of the assignment.")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, help_text="The subject to which this assignment belongs.")
    teachers = models.ManyToManyField(CustomUser, related_name='assignments_as_teacher', help_text="Teachers assigning this work.")
    students = models.ManyToManyField(Student, related_name='assignments_as_student', help_text="Students assigned to this work.")
    max_score = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Maximum score that can be achieved for this assignment."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    material = models.ManyToManyField(TeachingResource, related_name="homework_resource")
    due_date = models.DateField(
        help_text="The deadline for the homework."
    )
    marked = models.BooleanField(null=False, blank=False, default=False)

    def __str__(self):
        return f"{self.title} - {self.subject.name}"
    

class AssignmentAttempt(models.Model):
    """
    Represents an attempt by a student to complete and submit an assignment.
    """
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="attempts")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="assignment_attempts")
    submitted_at = models.DateTimeField(auto_now_add=True)
    answer_text = models.TextField(blank=True, help_text="Student's written response.")
    submitted_files = models.ManyToManyField(TeachingResource, blank=True, related_name="assignment_attempts")
    graded = models.BooleanField(default=False)
    accepted = models.BooleanField(default=False)
    class Meta:
        unique_together = ('assignment', 'student')  # Prevent multiple attempts if needed

    def __str__(self):
        return f"{self.student} - {self.assignment.title}"


class Feedback(models.Model):
    """
    Feedback is associated to an assignment
    """
    assignmentAttempt = models.ForeignKey(AssignmentAttempt, on_delete=models.CASCADE, related_name="feedback_entries", null=True)
    teacher = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    text = models.TextField(max_length=2000, blank=True, help_text="Teacher's feedback text.")
    created_at = models.DateTimeField(auto_now_add=True)
    score = models.SmallIntegerField(null=True, blank=False)

    def __str__(self):
        return f"{self.teacher.get_full_name} - {self.score}"


