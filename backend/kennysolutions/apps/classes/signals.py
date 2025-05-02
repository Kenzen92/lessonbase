# your_app/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AssignmentAttempt, Assignment

@receiver(post_save, sender=AssignmentAttempt)
def check_assignment_graded_status(sender, instance, created, **kwargs):
    """
    Checks if all assignment attempts for an assignment are graded
    and updates the assignment's marked status accordingly.
    """
    # We only care if an existing attempt was saved and its graded status changed
    # from False to True, or if a new attempt was created and is graded.
    if instance.graded:
        assignment = instance.assignment
        total_students = assignment.students.count()
        graded_attempts_count = assignment.attempts.filter(graded=True).count()

        # Check if all students who were assigned have a graded attempt
        if total_students > 0 and graded_attempts_count == total_students:
            # If the assignment is not already marked, mark it as complete
            if not assignment.marked:
                assignment.marked = True
                # Use update_fields to prevent the post_save signal on Assignment
                # from potentially causing issues or infinite loops if it had its own receivers.
                assignment.save(update_fields=['marked'])