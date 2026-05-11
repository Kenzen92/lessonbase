import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("backend", "0004_classroomchatmessage"),
    ]

    operations = [
        migrations.AlterField(
            model_name="chat",
            name="id",
            field=models.UUIDField(
                default=uuid.uuid4,
                editable=False,
                primary_key=True,
                serialize=False,
            ),
        ),
    ]