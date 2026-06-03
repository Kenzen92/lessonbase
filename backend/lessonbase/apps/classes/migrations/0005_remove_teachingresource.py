"""
Removes the TeachingResource model. Resources are now managed via apps.resources.Resource.

Depends on assignments.0003_redesign_submission_feedback which removes all M2M fields
that referenced TeachingResource (Assignment.material, Submission.submitted_files,
Feedback.submitted_files).  Only once those cross-app references are gone can
DeleteModel(TeachingResource) succeed.

Pre-launch migration — no data to preserve.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0003_redesign_submission_feedback"),
        ("classes", "0004_sessionfeedback"),
    ]

    operations = [
        migrations.DeleteModel(
            name="TeachingResource",
        ),
    ]
