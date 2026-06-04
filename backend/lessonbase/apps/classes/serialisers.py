from datetime import datetime, timezone
from apps.user_accounts.models import ClassGroup
from apps.core.serializers import TeacherClassEventSerializer
from apps.user_accounts.serializers import (
    StudentSerializer,
    ClassGroupUserSerializer,
)
from rest_framework import serializers
from apps.classes.models import ClassEvent, SessionFeedback
from apps.tags.serializers import TagSerializer
from apps.tags.utils import set_tags, tags_for


class ResourceSummarySerializer(serializers.Serializer):
    """Lightweight read-only serializer for resources nested inside class-event responses."""

    id = serializers.IntegerField(source="resource.id")
    title = serializers.CharField(source="resource.title")
    kind = serializers.CharField(source="resource.kind")
    file = serializers.FileField(source="resource.file", use_url=True)
    url = serializers.URLField(source="resource.url")
    original_name = serializers.CharField(source="resource.original_name")
    mime_type = serializers.CharField(source="resource.mime_type")
    added_by = serializers.PrimaryKeyRelatedField(read_only=True)


class ClassEventCreateSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    tags = serializers.ListField(required=False, default=list)
    class_group = serializers.PrimaryKeyRelatedField(
        queryset=ClassGroup.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = ClassEvent
        fields = [
            "id",
            "start_time",
            "duration",
            "tags",
            "students",
            "teachers",
            "class_group",
            "name",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        event = super().create(validated_data)
        set_tags(event, tags)
        return event

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        event = super().update(instance, validated_data)
        if tags is not None:
            set_tags(event, tags)
        return event


class ClassEventDateOrderedSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()
    resources = serializers.SerializerMethodField()
    class_group = ClassGroupUserSerializer(read_only=True)
    previous = serializers.SerializerMethodField()

    def get_previous(self, obj):
        return obj.start_time < datetime.now(timezone.utc)

    def get_tags(self, obj):
        return TagSerializer(tags_for(obj), many=True).data

    def get_resources(self, obj):
        links = obj.resource_links.select_related("resource").all()
        return ResourceSummarySerializer(links, many=True).data

    class Meta:
        model = ClassEvent
        fields = [
            "id",
            "start_time",
            "duration",
            "tags",
            "students",
            "teachers",
            "resources",
            "previous",
            "class_group",
            "name",
            "access_token",
            "classroom_type",
        ]
        read_only_fields = ["id", "access_token"]


class SessionFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionFeedback
        fields = ["id", "class_event", "rating", "comment", "created_at"]
        read_only_fields = ["id", "created_at"]


class ClassEventSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()
    resources = serializers.SerializerMethodField()

    def get_tags(self, obj):
        return TagSerializer(tags_for(obj), many=True).data

    def get_resources(self, obj):
        links = obj.resource_links.select_related("resource").all()
        return ResourceSummarySerializer(links, many=True).data

    class Meta:
        model = ClassEvent
        fields = [
            "id",
            "start_time",
            "duration",
            "tags",
            "students",
            "teachers",
            "resources",
            "name",
            "access_token",
            "classroom_type",
        ]
        read_only_fields = ["id", "access_token"]
