from django.contrib import admin
from apps.user_accounts.models import CustomUser, Student, Teacher, Staff
from apps.subjects.models import Subject

admin.site.register(CustomUser)
admin.site.register(Student)
admin.site.register(Teacher)
admin.site.register(Staff)
admin.site.register(Subject)
