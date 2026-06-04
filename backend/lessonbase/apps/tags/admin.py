from django.contrib import admin
from apps.tags.models import Tag, TaggedItem


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "kind", "color")
    list_filter = ("kind",)
    search_fields = ("name",)


@admin.register(TaggedItem)
class TaggedItemAdmin(admin.ModelAdmin):
    list_display = ("id", "tag", "content_type", "object_id")
    list_filter = ("content_type",)
