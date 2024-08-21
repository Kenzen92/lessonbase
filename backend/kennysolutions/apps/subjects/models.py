from django.db import models

from django.db import models

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    reserved_names = (
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'History',
        'Literature',
        'Computer Science',
        'Art',
        'Music',
        'Geography',
    )