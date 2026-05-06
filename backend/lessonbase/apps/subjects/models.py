from django.db import models

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=8, unique=True, null=True)
    color = models.CharField(max_length=100, null=True)
    reserved_names = (
        ('Mathematics', 'MAT', '#1a237e'),
        ('English', 'ENG', '#311b92'),
        ('Physics', 'PHY', '#004d40'),
        ('Chemistry', 'CHE', '#1a237e'), # Note: Color is the same as Math, consider if codes should also imply unique colors
        ('Biology', 'BIO', '#006064'),
        ('History', 'HIS', '#455a64'),
        ('Literature', 'LIT', '#263238'),
        ('Computer Science', 'CSC', '#0d47a1'),
        ('Art', 'ART', '#b71c1c'),
        ('Music', 'MUS', '#37474f'),
        ('Geography', 'GEO', '#f57f17'),
    )