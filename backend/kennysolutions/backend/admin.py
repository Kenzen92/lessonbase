from django.contrib import admin
from .models import CustomUser, Student, Teacher, Staff, ClassEvent, Subject
# Register your models here.
admin.site.register(CustomUser)
admin.site.register(Student)
admin.site.register(Teacher)
admin.site.register(Staff)
admin.site.register(ClassEvent)
admin.site.register(Subject)