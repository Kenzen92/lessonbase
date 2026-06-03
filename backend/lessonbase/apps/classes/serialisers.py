from datetime import datetime, timezone
from apps.user_accounts.models import ClassGroup
from apps.core.serializers import TeacherClassEventSerializer
from apps.user_accounts.serializers import (
    StudentSerializer,
    ClassGroupUserSerializer,
)
from rest_framework import serializers
from apps.subjects.models import Subject
from apps.classes.models import ClassEvent, SessionFeedback
from apps.subjects.serializers import SubjectSerializer


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
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    class_group = serializers.PrimaryKeyRelatedField(
        queryset=ClassGroup.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = ClassEvent
        fields = [
            "id",
            "start_time",
            "duration",
            "subject",
            "students",
            "teachers",
            "class_group",
            "name",
        ]
        read_only_fields = ["id"]


class ClassEventDateOrderedSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    subject = SubjectSerializer(many=False, read_only=True)
    resources = serializers.SerializerMethodField()
    class_group = ClassGroupUserSerializer(read_only=True)
    previous = serializers.SerializerMethodField()

    def get_previous(self, obj):
        return obj.start_time < datetime.now(timezone.utc)

    def get_resources(self, obj):
        links = obj.resource_links.select_related("resource").all()
        return ResourceSummarySerializer(links, many=True).data

    class Meta:
        model = ClassEvent
        fields = [
            "id",
            "start_time",
            "duration",
            "subject",
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
    subject = SubjectSerializer(read_only=True)
    resources = serializers.SerializerMethodField()

    def get_resources(self, obj):
        links = obj.resource_links.select_related("resource").all()
        return ResourceSummarySerializer(links, many=True).data

    class Meta:
        model = ClassEvent
        fields = [
            "id",
            "start_time",
            "duration",
            "subject",
            "students",
            "teachers",
            "resources",
            "name",
            "access_token",
            "classroom_type",
        ]
        read_only_fields = ["id", "access_token"]
