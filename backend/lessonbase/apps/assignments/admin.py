from django.contrib import admin
from apps.assignments.models import Assignment, Submission, Feedback


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "subject", "max_score", "due_date", "marked")
    search_fields = ("title", "subject__name")
    list_filter = ("subject", "marked", "due_date")
    ordering = ("due_date",)
    filter_horizontal = ("teachers", "students")


class FeedbackInline(admin.StackedInline):
    model = Feedback
    extra = 0
    fields = ("teacher", "score", "text", "accepted")


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "assignment", "student", "status", "submitted_at")
    search_fields = ("assignment__title", "student__username")
    list_filter = ("status",)
    ordering = ("-submitted_at",)
    inlines = [FeedbackInline]


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("id", "submission", "teacher", "score", "accepted", "created_at")
    search_fields = ("submission__assignment__title", "teacher__username")
    list_filter = ("accepted", "created_at")
    ordering = ("-created_at",)
