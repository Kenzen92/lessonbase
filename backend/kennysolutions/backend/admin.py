from django.contrib import admin
from apps.user_accounts.models import CustomUser, Student, Teacher, Staff
from apps.subjects.models import Subject
from apps.classes.models import ClassEvent
# Register your models here.
admin.site.register(CustomUser)
admin.site.register(Student)
admin.site.register(Teacher)
admin.site.register(Staff)
admin.site.register(ClassEvent)
admin.site.register(Subject)