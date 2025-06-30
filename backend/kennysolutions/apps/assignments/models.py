from django.db.models import Model, CharField, TextField, BooleanField, Q, DateField, ManyToManyField, PositiveIntegerField, ForeignKey, DateTimeField, CASCADE, SmallIntegerField
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.subjects.models import Subject
from apps.user_accounts.models import ClassGroup, CustomUser, Student
from apps.classes.models import TeachingResource

# Create your models here.


class Assignment(Model):
    """
    An assignment represents any work given by a teacher to students. Assignments are connected to a specific subject.
    """
    title = CharField(null=False, max_length=200, help_text="Title of the assignment.")
    description = TextField(max_length=1000, help_text="Detailed description of the assignment.", null=True, blank=True)
    subject = ForeignKey(Subject, on_delete=CASCADE, help_text="The subject to which this assignment belongs.")
    teachers = ManyToManyField(CustomUser, related_name='assignments_as_teacher', help_text="Teachers assigning this work.")
    students = ManyToManyField(Student, related_name='assignments_as_student', help_text="Students assigned to this work.")
    class_groups = ManyToManyField(ClassGroup, related_name='assignment_as_class_group')
    max_score = PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Maximum score that can be achieved for this assignment."
    )
    created_at = DateTimeField(auto_now_add=True)
    material = ManyToManyField(TeachingResource, related_name="homework_resource")
    set_date = DateField(
        default=timezone.now,
        help_text="The date when the homework was assigned."
    )
    due_date = DateField(
        help_text="The deadline for the homework."
    )
    to_mark = BooleanField(null=False, blank=False, default=False)
    marked = BooleanField(null=False, blank=False, default=False)

    def __str__(self):
        return f"{self.title} - {self.subject.name}"
    
    @property
    def get_progress(self):
        """
        Evaluates the progress of this assignment in terms of how many students have submitted an accepted assignment
        """
        numberOfStudents = self.students.count()
        if numberOfStudents == 0:
            return 0  # Avoid division by zero if no students are assigned

        accepted_attempts_count = self.attempts.filter(
            Q(graded=True) & Q(accepted=True)
        ).count()

        return (accepted_attempts_count / numberOfStudents) * 100


class AssignmentAttempt(Model):
    """
    Represents an attempt by a student to complete and submit an assignment.
    """
    assignment = ForeignKey(Assignment, on_delete=CASCADE, related_name="attempts")
    student = ForeignKey(Student, on_delete=CASCADE, related_name="assignment_attempts")
    submitted_at = DateTimeField(auto_now_add=True)
    answer_text = TextField(blank=True, help_text="Student's written response.")
    submitted_files = ManyToManyField(TeachingResource, blank=True, related_name="assignment_attempts")
    graded = BooleanField(default=False)
    accepted = BooleanField(default=False)
    class Meta:
        unique_together = ('assignment', 'student')  # Prevent multiple attempts if needed

    def __str__(self):
        return f"{self.student} - {self.assignment.title}"


class Feedback(Model):
    """
    Feedback is associated to an assignment
    """
    assignmentAttempt = ForeignKey(AssignmentAttempt, on_delete=CASCADE, related_name="feedback_entries", null=True)
    teacher = ForeignKey(CustomUser, on_delete=CASCADE)
    text = TextField(max_length=2000, blank=True, help_text="Teacher's feedback text.")
    created_at = DateTimeField(auto_now_add=True)
    score = SmallIntegerField(null=True, blank=False)
    submitted_files = ManyToManyField(TeachingResource, blank=True, related_name="feedbacks")


    def __str__(self):
        return f"{self.teacher.get_full_name} - {self.score}"
