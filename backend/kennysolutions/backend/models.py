from django.db import models

class Person(models.Model):
    pass

class Teacher(Person):
    pass

class Student(Person):
    pass

class Staff(Person):
    pass

class event(models.Model):
    pass

class ClassEvent(models.Model):
    pass

class TrainingEvent(models.Model):
    pass