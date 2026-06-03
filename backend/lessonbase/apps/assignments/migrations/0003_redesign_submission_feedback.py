"""
Incremental migration: assignments redesign.

Transforms the schema that was applied in production (AssignmentAttempt + old Feedback)
to the new schema:
  - Renames AssignmentAttempt → Submission, adds Status field
  - Rebuilds Feedback as OneToOneField to Submission
  - Replaces all TeachingResource M2M fields with resources.Resource M2M fields
  - Removes Assignment.material M2M — this unblocks classes.0005 DeleteModel(TeachingResource)
  - Normalises field definitions (removes help_text, aligns types) to match current models.py

Production safety:
  - RenameModel is a cheap DDL rename, no data moved
  - submitted_at NOT NULL → nullable: relaxing a constraint is always safe
  - score SmallIntegerField → PositiveSmallIntegerField: same storage, no truncation possible
    (existing negatives would violate the constraint but none should exist in a pre-launch DB)
  - The RunPython step copies assignmentAttempt_id → submission_id before making it NOT NULL
"""

import django.db.models.deletion
from django.db import migrations, models


def copy_feedback_submission(apps, schema_editor):
    """
    Populate Feedback.submission_id from the existing assignmentAttempt_id.

    The old Feedback.assignmentAttempt was a nullable FK (not unique), so theoretically
    multiple Feedback rows could reference the same AssignmentAttempt.  We handle this
    by keeping only the most-recent Feedback per attempt (highest id) and deleting the
    rest, then copying the FK value to the new submission_id column.

    Wrapped in transaction.atomic() so the data copy is safe even though the outer
    migration runs with atomic=False (required to avoid PostgreSQL's
    "cannot ALTER TABLE because it has pending trigger events" error).
    """
    from django.db import transaction

    Feedback = apps.get_model("assignments", "Feedback")

    with transaction.atomic():
        # Drop orphaned feedback (no linked attempt at all)
        Feedback.objects.filter(assignmentAttempt__isnull=True).delete()

        # Deduplicate: keep the newest Feedback per attempt, delete older duplicates
        seen = set()
        for feedback in Feedback.objects.order_by("-id"):
            attempt_id = feedback.assignmentAttempt_id
            if attempt_id is None or attempt_id in seen:
                feedback.delete()
            else:
                seen.add(attempt_id)
                # The attempt table was just renamed to submission; the row IDs are identical
                feedback.submission_id = attempt_id
                feedback.save(update_fields=["submission_id"])

        # Safety net: remove any remaining rows that still have no submission_id
        Feedback.objects.filter(submission__isnull=True).delete()


class Migration(migrations.Migration):

    # Required: avoids "cannot ALTER TABLE assignments_feedback because it has pending
    # trigger events" in PostgreSQL.  Adding a nullable FK and then making it NOT NULL
    # within a single transaction leaves deferred FK-check triggers pending, which
    # blocks subsequent ALTER TABLE statements on the same table.
    # With atomic=False each DDL statement auto-commits, clearing pending triggers.
    atomic = False

    dependencies = [
        ("assignments", "0002_initial"),
        ("resources", "0001_initial"),
    ]

    operations = [

        # ── Submission (formerly AssignmentAttempt) ──────────────────────────

        # Rename the model (and its underlying DB table + M2M junction tables)
        migrations.RenameModel(
            old_name="AssignmentAttempt",
            new_name="Submission",
        ),

        # Update FK related_names to match current models.py
        migrations.AlterField(
            model_name="submission",
            name="assignment",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="submissions",
                to="assignments.assignment",
            ),
        ),
        migrations.AlterField(
            model_name="submission",
            name="student",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="submissions",
                to="user_accounts.student",
            ),
        ),

        # Remove help_text from answer_text (Python-only, aligns migration state with models.py)
        migrations.AlterField(
            model_name="submission",
            name="answer_text",
            field=models.TextField(blank=True),
        ),

        # Add status (existing rows were all submitted; pre-launch DB has no graded rows to preserve)
        migrations.AddField(
            model_name="submission",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("submitted", "Submitted"),
                    ("graded", "Graded"),
                    ("returned", "Returned for revision"),
                ],
                default="submitted",
                max_length=12,
            ),
            preserve_default=False,
        ),

        # Make submitted_at writable and nullable (was auto_now_add=True, i.e. NOT NULL)
        migrations.AlterField(
            model_name="submission",
            name="submitted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),

        # Remove old boolean fields superseded by status / moved to Feedback
        migrations.RemoveField(model_name="submission", name="graded"),
        migrations.RemoveField(model_name="submission", name="accepted"),

        # Swap TeachingResource M2M for resources.Resource M2M
        migrations.RemoveField(model_name="submission", name="submitted_files"),
        migrations.AddField(
            model_name="submission",
            name="files",
            field=models.ManyToManyField(
                blank=True,
                related_name="submission_links",
                to="resources.resource",
            ),
        ),

        # ── Feedback ─────────────────────────────────────────────────────────

        # Remove help_text from text (Python-only)
        migrations.AlterField(
            model_name="feedback",
            name="text",
            field=models.TextField(blank=True, max_length=2000),
        ),

        # score: SmallIntegerField → PositiveSmallIntegerField (aligns with models.py)
        migrations.AlterField(
            model_name="feedback",
            name="score",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),

        # New fields
        migrations.AddField(
            model_name="feedback",
            name="accepted",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="feedback",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),

        # Add related_name to teacher FK (Python-only, matches models.py).
        # Use an explicit string reference — NOT settings.AUTH_USER_MODEL — because
        # Feedback.teacher points to CustomUser, not CustomAccount (AUTH_USER_MODEL).
        migrations.AlterField(
            model_name="feedback",
            name="teacher",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="feedback_given",
                to="user_accounts.customuser",
            ),
        ),

        # Add submission OneToOneField — nullable initially so the data migration can populate it
        migrations.AddField(
            model_name="feedback",
            name="submission",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="feedback",
                to="assignments.submission",
            ),
        ),

        # Copy assignmentAttempt_id → submission_id (handles orphans and duplicates)
        migrations.RunPython(
            code=copy_feedback_submission,
            reverse_code=migrations.RunPython.noop,
        ),

        # Make submission non-nullable now that every remaining row has it populated
        migrations.AlterField(
            model_name="feedback",
            name="submission",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="feedback",
                to="assignments.submission",
            ),
        ),

        # Drop the old FK to AssignmentAttempt (now Submission — column: assignmentAttempt_id)
        migrations.RemoveField(model_name="feedback", name="assignmentAttempt"),

        # Swap TeachingResource M2M for resources.Resource M2M
        migrations.RemoveField(model_name="feedback", name="submitted_files"),
        migrations.AddField(
            model_name="feedback",
            name="files",
            field=models.ManyToManyField(
                blank=True,
                related_name="feedback_links",
                to="resources.resource",
            ),
        ),

        # ── Assignment ───────────────────────────────────────────────────────

        # Remove material M2M to TeachingResource.
        # This MUST happen in this migration so that classes.0005 (which depends on this
        # migration) can safely DeleteModel(TeachingResource) with no remaining references.
        migrations.RemoveField(model_name="assignment", name="material"),

        # Field normalisation (help_text removal, type alignment) is deferred to 0004
        # to keep this migration focused on schema changes and avoid any risk of the
        # M2M rebuild using the wrong AUTH_USER_MODEL target.
    ]
