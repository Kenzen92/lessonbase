from django.contrib import admin
from apps.resources.models import Resource, ResourceTag, ClassResource, AssignmentMaterial


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ["title", "kind", "owner", "subject", "created_at", "deleted_at"]
    list_filter = ["kind", "subject", "deleted_at"]
    search_fields = ["title", "owner__username"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(ResourceTag)
class ResourceTagAdmin(admin.ModelAdmin):
    list_display = ["name", "owner"]
    search_fields = ["name", "owner__username"]


@admin.register(ClassResource)
class ClassResourceAdmin(admin.ModelAdmin):
    list_display = ["resource", "class_event", "added_by", "created_at"]


@admin.register(AssignmentMaterial)
class AssignmentMaterialAdmin(admin.ModelAdmin):
    list_display = ["resource", "assignment"]
