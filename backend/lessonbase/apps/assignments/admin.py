from django.contrib import admin

from apps.assignments.models import Assignment, AssignmentAttempt, Feedback


# Register your models here.
@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "subject", "max_score", "due_date", "marked")
    search_fields = ("title", "subject__name")
    list_filter = ("subject", "marked", "due_date")
    ordering = ("due_date",)
    filter_horizontal = ("teachers", "students", "material")


# Create the inline class for Feedback
class FeedbackInline(admin.TabularInline):  # Or admin.StackedInline
    model = Feedback
    extra = 1  # Number of empty forms to display for adding new feedback
    fields = ("teacher", "score", "text")  # Fields to display in the inline form


@admin.register(AssignmentAttempt)
class AssignmentAttemptAdmin(admin.ModelAdmin):
    list_display = ("id", "assignment", "student", "graded")
    search_fields = ("assignment__title", "student__username")
    ordering = ("-assignment__due_date",)
    inlines = [FeedbackInline]  # Add the FeedbackInline here


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("id", "assignmentAttempt", "teacher", "score", "created_at")
    search_fields = ("assignment__title", "teacher__username", "teacher__email")
    list_filter = ("score", "created_at")
    ordering = ("-created_at",)
