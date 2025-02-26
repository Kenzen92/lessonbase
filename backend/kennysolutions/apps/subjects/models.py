from django.db import models

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=100, null=-True)
    reserved_names = (
        ('Mathematics', '#2803fc'),
        ('English', '#5c2ba1'),
        ('Physics', '#4a9375'),
        ('Chemistry', '#4361ee'),
        ('Biology', '#4ecdc4'),
        ('History', '#a8edea'),
        ('Literature', '#030557'),
        ('Computer Science', '#2962ff'),
        ('Art', '#ed4245'),
        ('Music', '#2c3e50'),
        ('Geography',  '#574917')
    )
