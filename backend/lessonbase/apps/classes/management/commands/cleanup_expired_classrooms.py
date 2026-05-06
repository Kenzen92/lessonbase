from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.classes.models import ClassEvent


class Command(BaseCommand):
    help = "Deactivates expired classrooms (30 minutes after scheduled end time)"

    def handle(self, *args, **options):
        self.stdout.write("Starting cleanup of expired classrooms...")

        deactivated_count = 0
        active_classrooms = ClassEvent.objects.filter(is_active=True)

        for classroom in active_classrooms:
            if classroom.is_expired():
                classroom.is_active = False
                classroom.save()
                deactivated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Deactivated classroom: {classroom.name} (ID: {classroom.id})"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully deactivated {deactivated_count} expired classrooms"
            )
        )
