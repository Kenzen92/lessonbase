from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.subjects.models import Subject
from apps.user_accounts.models import ClassGroup, CustomUser, Student
from apps.classes.models import TeachingResource

# Create your models here.


class Assignment(models.Model):
    """
    An assignment represents any work given by a teacher to students. Assignments are connected to a specific subject.
    """
    title = models.CharField(null=False, max_length=200, help_text="Title of the assignment.")
    description = models.TextField(max_length=1000, help_text="Detailed description of the assignment.", null=True, blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, help_text="The subject to which this assignment belongs.")
    teachers = models.ManyToManyField(CustomUser, related_name='assignments_as_teacher', help_text="Teachers assigning this work.")
    students = models.ManyToManyField(Student, related_name='assignments_as_student', help_text="Students assigned to this work.")
    class_groups = models.ManyToManyField(ClassGroup, related_name='assignment_as_class_group')
    max_score = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Maximum score that can be achieved for this assignment."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    material = models.ManyToManyField(TeachingResource, related_name="homework_resource")
    set_date = models.DateField(
        default=timezone.now,
        help_text="The date when the homework was assigned."
    )
    due_date = models.DateField(
        help_text="The deadline for the homework."
    )
    to_mark = models.BooleanField(null=False, blank=False, default=False)
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
    submitted_files = models.ManyToManyField(TeachingResource, blank=True, related_name="feedbacks")


    def __str__(self):
        return f"{self.teacher.get_full_name} - {self.score}"
