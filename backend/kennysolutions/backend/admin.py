from django.contrib import admin
from apps.user_accounts.models import CustomUser, Student, Teacher, Staff
from .models import ClassEvent
from apps.subjects.models import Subject
# Register your models here.
admin.site.register(CustomUser)
admin.site.register(Student)
admin.site.register(Teacher)
admin.site.register(Staff)
admin.site.register(ClassEvent)
admin.site.register(Subject)