"""
Field normalisation migration.

On dev: migration 0003 mistakenly used `to=settings.AUTH_USER_MODEL` (CustomAccount)
for the Assignment.teachers AlterField, which caused Django to rebuild the M2M junction
table with a `customaccount_id` column instead of the correct `customuser_id`.

This migration corrects the DB (conditional rename) and updates the migration state to
use 'user_accounts.customuser' — matching Assignment.teachers in models.py.

On production: 0003 (post-fix) never had the wrong AlterField, so the junction table
already has `customuser_id`.  The RunPython is a no-op.  The AlterField operations
strip help_text and align field types — Python-only changes that keep
`makemigrations --check` clean.
"""

import django.core.validators
import django.utils.timezone
from django.db import migrations, models


def fix_teachers_junction_column(apps, schema_editor):
    """
    If `assignments_assignment_teachers` has a `customaccount_id` column (created by
    the incorrect AlterField in migration 0003 on dev), rename it to `customuser_id`
    and update the FK constraint to point at user_accounts_customuser.id.

    On production (or any DB where the column is already correct) this is a no-op.
    """
    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'assignments_assignment_teachers'
              AND column_name = 'customaccount_id'
        """)
        if not cursor.fetchone():
            return  # Column is already correct — nothing to do

        # Drop the wrong FK constraint
        cursor.execute("""
            ALTER TABLE assignments_assignment_teachers
            DROP CONSTRAINT IF EXISTS
                assignments_assignme_customaccount_id_41b0f189_fk_user_acco
        """)
        # Rename the column
        cursor.execute("""
            ALTER TABLE assignments_assignment_teachers
            RENAME COLUMN customaccount_id TO customuser_id
        """)
        # Re-add FK constraint pointing at the correct table
        cursor.execute("""
            ALTER TABLE assignments_assignment_teachers
            ADD CONSTRAINT assignments_assignment_teachers_customuser_id_fk
            FOREIGN KEY (customuser_id)
            REFERENCES user_accounts_customuser (id)
            DEFERRABLE INITIALLY DEFERRED
        """)


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0003_redesign_submission_feedback"),
        ("user_accounts", "0001_initial"),
    ]

    operations = [
        # Fix the DB column name (dev: renames customaccount_id → customuser_id;
        # production: no-op since the column was never renamed there)
        migrations.RunPython(
            code=fix_teachers_junction_column,
            reverse_code=migrations.RunPython.noop,
        ),

        # Update migration state to use 'user_accounts.customuser' (not AUTH_USER_MODEL)
        migrations.AlterField(
            model_name="assignment",
            name="teachers",
            field=models.ManyToManyField(
                related_name="assignments_as_teacher",
                to="user_accounts.customuser",
            ),
        ),

        # Remove help_text from remaining Assignment fields (Python-only, no DB change)
        migrations.AlterField(
            model_name="assignment",
            name="title",
            field=models.CharField(max_length=200),
        ),
        migrations.AlterField(
            model_name="assignment",
            name="description",
            field=models.TextField(blank=True, max_length=1000, null=True),
        ),
        migrations.AlterField(
            model_name="assignment",
            name="max_score",
            field=models.PositiveIntegerField(
                validators=[
                    django.core.validators.MinValueValidator(1),
                    django.core.validators.MaxValueValidator(100),
                ]
            ),
        ),
        migrations.AlterField(
            model_name="assignment",
            name="set_date",
            field=models.DateField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name="assignment",
            name="due_date",
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name="assignment",
            name="students",
            field=models.ManyToManyField(
                related_name="assignments_as_student",
                to="user_accounts.student",
            ),
        ),
    ]
