"""
Creates ClassResource and AssignmentMaterial join models.
Depends on classes and assignments apps being ready.
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0001_initial"),
        ("classes", "0004_sessionfeedback"),
        ("resources", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ClassResource",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "class_event",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="resource_links",
                        to="classes.classevent",
                    ),
                ),
                (
                    "resource",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="class_links",
                        to="resources.resource",
                    ),
                ),
                (
                    "added_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AlterUniqueTogether(
            name="classresource",
            unique_together={("class_event", "resource")},
        ),
        migrations.CreateModel(
            name="AssignmentMaterial",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "assignment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="material_links",
                        to="assignments.assignment",
                    ),
                ),
                (
                    "resource",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assignment_links",
                        to="resources.resource",
                    ),
                ),
            ],
        ),
        migrations.AlterUniqueTogether(
            name="assignmentmaterial",
            unique_together={("assignment", "resource")},
        ),
    ]
