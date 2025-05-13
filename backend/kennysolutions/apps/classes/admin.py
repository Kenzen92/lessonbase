from django.contrib import admin
from .models import Event, ClassEvent, TeachingResource

# Inline classes for related models
class TeachingResourceInline(admin.TabularInline):
    model = TeachingResource
    extra = 1  # Number of empty rows to display for adding new related objects
    fields = ('name', 'description', 'file', 'subject', 'upload_date')
    readonly_fields = ('upload_date',)
    show_change_link = True


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



