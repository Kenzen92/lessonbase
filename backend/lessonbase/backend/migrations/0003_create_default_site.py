# Migration to create default Site instance for django-allauth
from django.db import migrations


def create_default_site(apps, schema_editor):
    """Create the default Site object required by django-allauth"""
    Site = apps.get_model('sites', 'Site')
    
    # Create or update the default site
    Site.objects.update_or_create(
        id=1,
        defaults={
            'domain': 'localhost:8000',
            'name': 'LessonBase'
        }
    )


def remove_default_site(apps, schema_editor):
    """Remove the default site if migration is reversed"""
    Site = apps.get_model('sites', 'Site')
    Site.objects.filter(id=1).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0002_initial'),
        ('sites', '0001_initial'),  # Ensure sites app is migrated first
    ]

    operations = [
        migrations.RunPython(create_default_site, remove_default_site),
    ]
