"""
Signal: when a Feedback record is saved (created or updated), recalculate
whether the parent Assignment should be marked as fully graded.

Rules:
  - `assignment.to_mark = True` if any student has a submitted (but not yet
    graded) submission.
  - `assignment.marked = True` when every assigned student either has no
    submission, or has a graded submission.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.assignments.models import Feedback, Submission


@receiver(post_save, sender=Feedback)
def update_assignment_marked_status(sender, instance, **kwargs):
    """
    Recalculate Assignment.to_mark and Assignment.marked after any feedback
    is saved, since feedback creation/edit is the action that grades a
    submission.
    """
    assignment = instance.submission.assignment

    submitted_ungraded = Submission.objects.filter(
        assignment=assignment,
        status=Submission.Status.SUBMITTED,
    ).exists()

    all_graded = not Submission.objects.filter(
        assignment=assignment,
        status__in=[Submission.Status.DRAFT, Submission.Status.SUBMITTED],
    ).exists()

    assignment.to_mark = submitted_ungraded
    assignment.marked = all_graded
    assignment.save(update_fields=["to_mark", "marked"])
