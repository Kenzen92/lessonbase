from django.contrib import admin
from .models import CustomUser, Student, Teacher, Staff, ClassEvent
# Register your models here.
admin.site.register(CustomUser)
admin.site.register(Student)
admin.site.register(Teacher)
admin.site.register(Staff)
admin.site.register(ClassEvent)