from rest_framework import serializers
from apps.resources.models import Resource, ResourceTag, ALLOWED_MIME_TYPES
from apps.subjects.models import Subject


class ResourceTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceTag
        fields = ["id", "name"]
        read_only_fields = ["id"]


class ResourceSerializer(serializers.ModelSerializer):
    tags = ResourceTagSerializer(many=True, read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            "id",
            "title",
            "description",
            "kind",
            "file",
            "file_url",
            "original_name",
            "mime_type",
            "size_bytes",
            "url",
            "subject",
            "tags",
            "owner",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "file_url",
            "original_name",
            "mime_type",
            "size_bytes",
            "created_at",
            "updated_at",
        ]

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class ResourceCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    description = serializers.CharField(
        max_length=1000, required=False, allow_blank=True, default=""
    )
    kind = serializers.ChoiceField(
        choices=Resource.Kind.choices, default=Resource.Kind.FILE
    )
    file = serializers.FileField(required=False)
    url = serializers.URLField(required=False, allow_blank=True)
    subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), required=False, allow_null=True
    )
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )

    def validate(self, data):
        from apps.resources.quota import upload_violation

        kind = data.get("kind", Resource.Kind.FILE)
        if kind == Resource.Kind.FILE:
            if "file" not in data:
                raise serializers.ValidationError(
                    {"file": "A file is required when kind is 'file'."}
                )
            f = data["file"]
            if f.content_type not in ALLOWED_MIME_TYPES:
                raise serializers.ValidationError(
                    {"file": f"File type '{f.content_type}' is not allowed."}
                )
            quota_error = upload_violation(self.context["request"].user, [f])
            if quota_error:
                raise serializers.ValidationError({"file": quota_error})
        elif kind == Resource.Kind.LINK:
            if not data.get("url"):
                raise serializers.ValidationError(
                    {"url": "A URL is required when kind is 'link'."}
                )
        return data

    def create(self, validated_data):
        owner = self.context["request"].user
        uploaded = validated_data.pop("file", None)
        tag_ids = validated_data.pop("tag_ids", [])
        title = validated_data.get("title") or (uploaded.name if uploaded else "")

        resource = Resource.objects.create(
            owner=owner,
            title=title,
            description=validated_data.get("description", ""),
            kind=validated_data.get("kind", Resource.Kind.FILE),
            file=uploaded,
            original_name=uploaded.name if uploaded else "",
            mime_type=uploaded.content_type if uploaded else "",
            size_bytes=uploaded.size if uploaded else None,
            url=validated_data.get("url", ""),
            subject=validated_data.get("subject"),
        )

        if tag_ids:
            tags = ResourceTag.objects.filter(id__in=tag_ids, owner=owner)
            resource.tags.set(tags)

        return resource


class ResourceUpdateSerializer(serializers.ModelSerializer):
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )

    class Meta:
        model = Resource
        fields = ["title", "description", "subject", "tag_ids"]

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop("tag_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tag_ids is not None:
            owner = self.context["request"].user
            tags = ResourceTag.objects.filter(id__in=tag_ids, owner=owner)
            instance.tags.set(tags)
        return instance
