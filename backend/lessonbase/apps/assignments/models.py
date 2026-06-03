from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.subjects.models import Subject
from apps.user_accounts.models import ClassGroup, CustomUser, Student


class Assignment(models.Model):
    """
    An assignment represents any work given by a teacher to students.
    """

    title = models.CharField(null=False, max_length=200)
    description = models.TextField(max_length=1000, null=True, blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teachers = models.ManyToManyField(CustomUser, related_name="assignments_as_teacher")
    students = models.ManyToManyField(Student, related_name="assignments_as_student")
    class_groups = models.ManyToManyField(
        ClassGroup, related_name="assignment_as_class_group"
    )
    max_score = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    set_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    to_mark = models.BooleanField(default=False)
    marked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} - {self.subject.name}"

    @property
    def get_progress(self):
        number_of_students = self.students.count()
        if number_of_students == 0:
            return 0
        accepted_count = self.submissions.filter(feedback__accepted=True).count()
        return (accepted_count / number_of_students) * 100


class Submission(models.Model):
    """
    A student's submission for an assignment (renamed from AssignmentAttempt).
    One submission per (assignment, student); student can update while Draft or Returned.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        GRADED = "graded", "Graded"
        RETURNED = "returned", "Returned for revision"

    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="submissions"
    )
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="submissions"
    )
    answer_text = models.TextField(blank=True)
    files = models.ManyToManyField(
        "resources.Resource", blank=True, related_name="submission_links"
    )
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.DRAFT
    )
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("assignment", "student")

    def __str__(self):
        return f"{self.student} — {self.assignment.title}"

    def submit(self):
        self.status = self.Status.SUBMITTED
        self.submitted_at = timezone.now()
        self.save(update_fields=["status", "submitted_at"])


class Feedback(models.Model):
    """
    Teacher feedback on a student submission. One feedback per submission (editable via PUT).
    """

    submission = models.OneToOneField(
        Submission, on_delete=models.CASCADE, related_name="feedback"
    )
    teacher = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="feedback_given"
    )
    text = models.TextField(max_length=2000, blank=True)
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    accepted = models.BooleanField(default=False)
    files = models.ManyToManyField(
        "resources.Resource", blank=True, related_name="feedback_links"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Feedback by {self.teacher} on {self.submission}"
