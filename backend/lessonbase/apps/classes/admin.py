from django.contrib import admin
from .models import Event, ClassEvent, SessionFeedback


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(ClassEvent)
class ClassEventAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "subject", "start_time", "duration", "created_at")
    search_fields = ("name", "subject__name")
    list_filter = ("subject", "start_time")
    ordering = ("start_time",)
    filter_horizontal = ("students", "teachers")


@admin.register(SessionFeedback)
class SessionFeedbackAdmin(admin.ModelAdmin):
    list_display = ("id", "class_event", "student", "rating", "created_at")
    list_filter = ("rating",)
