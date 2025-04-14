from django.contrib import admin
from .models import Event, ClassEvent, TeachingResource, Assignment, Feedback

# Inline classes for related models
class TeachingResourceInline(admin.TabularInline):
    model = TeachingResource
    extra = 1  # Number of empty rows to display for adding new related objects
    fields = ('name', 'description', 'file', 'subject', 'upload_date')
    readonly_fields = ('upload_date',)
    show_change_link = True


class FeedbackInline(admin.TabularInline):
    model = Feedback
    extra = 1
    fields = ('teacher', 'text', 'score', 'created_at')
    readonly_fields = ('created_at',)


# Admin classes
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
    list_filter = ('name',)


@admin.register(ClassEvent)
class ClassEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'subject', 'start_time', 'duration', 'created_at')
    search_fields = ('name', 'subject__name')
    list_filter = ('subject', 'start_time')
    ordering = ('start_time',)
    filter_horizontal = ('students', 'teachers')
    inlines = [TeachingResourceInline]


@admin.register(TeachingResource)
class TeachingResourceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'subject', 'upload_date', 'class_event')
    search_fields = ('name', 'subject__name')
    list_filter = ('subject', 'upload_date')
    ordering = ('-upload_date',)


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'subject', 'max_score', 'due_date', 'marked')
    search_fields = ('title', 'subject__name')
    list_filter = ('subject', 'marked', 'due_date')
    ordering = ('due_date',)
    filter_horizontal = ('teachers', 'students', 'material')



@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'assignmentAttempt', 'teacher', 'score', 'created_at')
    search_fields = ('assignment__title', 'teacher__username', 'teacher__email')
    list_filter = ('score', 'created_at')
    ordering = ('-created_at',)
