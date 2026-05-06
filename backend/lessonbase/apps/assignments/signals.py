# your_app/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.assignments.models import AssignmentAttempt


@receiver(post_save, sender=AssignmentAttempt)
def check_assignment_graded_status(sender, instance, created, **kwargs):
    """
    Checks if all assignment attempts for an assignment are graded
    and updates the assignment's marked status accordingly.
    """
    print(
        f"[DEBUG] Signal triggered for AssignmentAttempt ID {instance.id}, created={created}"
    )

    # We only care if an existing attempt was saved and its graded status changed
    # from False to True, or if a new attempt was created and is graded.
    print(f"[DEBUG] AssignmentAttempt ID {instance.id} is graded and accepted.")
    assignment = instance.assignment
    print(f"[DEBUG] Checking all attempts for Assignment ID {assignment.id}")

    all_assignment_students = assignment.students.all()
    all_graded = True
    for eachStudent in all_assignment_students:
        print(f"[DEBUG] Checking attempts for Student ID {eachStudent.id}")
        attempts = AssignmentAttempt.objects.filter(
            student=eachStudent, assignment=assignment, graded=False
        ).exists()
        if attempts:
            print(f"[DEBUG] Student ID {eachStudent.id} still has ungraded attempts.")
            all_graded = False
            assignment.to_mark = True
            break
    if all_graded:
        print(
            f"[DEBUG] All students have graded attempts for Assignment ID {assignment.id}"
        )
        assignment.marked = True
    else:
        assignment.marked = False
    assignment.save()
    print(
        f"[DEBUG] Assignment ID {assignment.id} saved with marked={assignment.marked}, to_mark={assignment.to_mark}"
    )
