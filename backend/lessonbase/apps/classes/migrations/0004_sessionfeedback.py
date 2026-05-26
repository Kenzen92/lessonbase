import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("classes", "0003_classevent_access_token_classevent_classroom_type_and_more"),
        ("user_accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SessionFeedback",
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
                    "rating",
                    models.SmallIntegerField(
                        help_text="Student rating of the session (1-5).",
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(5),
                        ],
                    ),
                ),
                ("comment", models.TextField(blank=True, max_length=1000)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "class_event",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="session_feedbacks",
                        to="classes.classevent",
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="session_feedbacks",
                        to="user_accounts.customuser",
                    ),
                ),
            ],
            options={
                "unique_together": {("class_event", "student")},
            },
        ),
    ]
