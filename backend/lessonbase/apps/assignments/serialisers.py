from datetime import datetime
from datetime import timezone as dt_timezone

from django.utils import timezone
from rest_framework import serializers
from apps.subjects.models import Subject
from apps.user_accounts.models import Teacher, Student
from apps.user_accounts.serializers import StudentSerializer
from apps.subjects.serializers import SubjectSerializer
from apps.assignments.models import Assignment, Submission, Feedback
from apps.resources.models import Resource, ALLOWED_MIME_TYPES, MAX_FILE_SIZE


class ResourceAttachmentSerializer(serializers.Serializer):
    """Read-only representation of a resource attached to a submission or feedback."""

    id = serializers.IntegerField()
    title = serializers.CharField()
    kind = serializers.CharField()
    file = serializers.FileField(use_url=True)
    url = serializers.URLField()
    original_name = serializers.CharField()
    mime_type = serializers.CharField()


# ---------------------------------------------------------------------------
# Assignment serializers
# ---------------------------------------------------------------------------


class AssignmentListSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer()
    teachers = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(), many=True
    )
    students = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), many=True
    )
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            "id",
            "title",
            "description",
            "subject",
            "teachers",
            "max_score",
            "created_at",
            "due_date",
            "set_date",
            "students",
            "progress",
        ]

    def get_progress(self, obj):
        return obj.get_progress


class AssignmentCreateSerializer(serializers.ModelSerializer):
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    max_score = serializers.IntegerField()
    due_date = serializers.DateField()
    set_date = serializers.DateField(default=datetime.now(dt_timezone.utc).date())
    students = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), many=True
    )

    class Meta:
        model = Assignment
        fields = [
            "title",
            "description",
            "subject",
            "max_score",
            "set_date",
            "due_date",
            "students",
        ]

    def create(self, validated_data):
        students = validated_data.pop("students", [])
        teacher = self.context["request"].user.get_real_instance()
        assignment = Assignment.objects.create(**validated_data)
        assignment.teachers.set([teacher])
        assignment.students.set(students)
        return assignment


class AssignmentDetailsSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(many=False)
    teachers = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(), many=True
    )
    students = StudentSerializer(many=True)
    progress = serializers.SerializerMethodField()
    materials = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            "id",
            "title",
            "description",
            "subject",
            "teachers",
            "max_score",
            "created_at",
            "set_date",
            "due_date",
            "students",
            "progress",
            "materials",
        ]

    def get_progress(self, obj):
        return obj.get_progress

    def get_materials(self, obj):
        links = obj.material_links.select_related("resource").all()
        return [
            {
                "id": link.resource.id,
                "title": link.resource.title,
                "kind": link.resource.kind,
                "file": link.resource.file.url if link.resource.file else None,
                "url": link.resource.url,
                "original_name": link.resource.original_name,
                "mime_type": link.resource.mime_type,
            }
            for link in links
        ]


# ---------------------------------------------------------------------------
# Submission serializers
# ---------------------------------------------------------------------------


class SubmissionCreateSerializer(serializers.Serializer):
    assignment = serializers.PrimaryKeyRelatedField(queryset=Assignment.objects.all())
    answer_text = serializers.CharField(required=False, allow_blank=True, default="")
    files = serializers.ListField(
        child=serializers.FileField(), required=False, default=list
    )
    resource_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )

    def validate_files(self, value):
        for f in value:
            if f.size > MAX_FILE_SIZE:
                raise serializers.ValidationError(
                    f"File '{f.name}' exceeds the 50 MB limit."
                )
            if f.content_type not in ALLOWED_MIME_TYPES:
                raise serializers.ValidationError(
                    f"File type '{f.content_type}' is not allowed."
                )
        return value

    def create(self, validated_data):
        student = self.context["request"].user.get_real_instance()
        assignment = validated_data["assignment"]
        answer_text = validated_data.get("answer_text", "")
        uploaded_files = validated_data.get("files", [])
        resource_ids = validated_data.get("resource_ids", [])

        submission, _ = Submission.objects.get_or_create(
            assignment=assignment,
            student=student,
            defaults={"answer_text": answer_text, "status": Submission.Status.DRAFT},
        )
        submission.answer_text = answer_text
        submission.status = Submission.Status.SUBMITTED
        submission.submitted_at = timezone.now()
        submission.save(update_fields=["answer_text", "status", "submitted_at"])

        for uploaded_file in uploaded_files:
            resource = Resource.objects.create(
                owner=student,
                title=uploaded_file.name,
                kind=Resource.Kind.FILE,
                file=uploaded_file,
                original_name=uploaded_file.name,
                mime_type=uploaded_file.content_type,
                size_bytes=uploaded_file.size,
            )
            submission.files.add(resource)

        for rid in resource_ids:
            try:
                resource = Resource.objects.get(id=rid, owner=student)
                submission.files.add(resource)
            except Resource.DoesNotExist:
                pass

        return submission


class SubmissionDetailsSerializer(serializers.ModelSerializer):
    student = StudentSerializer(many=False, read_only=True)
    assignment = AssignmentDetailsSerializer(many=False, read_only=True)
    files = serializers.SerializerMethodField()
    feedback = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            "id",
            "assignment",
            "student",
            "answer_text",
            "files",
            "status",
            "submitted_at",
            "feedback",
        ]

    def get_files(self, obj):
        return [
            {
                "id": r.id,
                "title": r.title,
                "kind": r.kind,
                "file": r.file.url if r.file else None,
                "url": r.url,
                "original_name": r.original_name,
                "mime_type": r.mime_type,
            }
            for r in obj.files.all()
        ]

    def get_feedback(self, obj):
        try:
            fb = obj.feedback
            return {
                "id": fb.id,
                "teacher": fb.teacher_id,
                "text": fb.text,
                "score": fb.score,
                "accepted": fb.accepted,
                "files": [
                    {
                        "id": r.id,
                        "title": r.title,
                        "kind": r.kind,
                        "file": r.file.url if r.file else None,
                        "url": r.url,
                        "original_name": r.original_name,
                    }
                    for r in fb.files.all()
                ],
                "created_at": fb.created_at,
                "updated_at": fb.updated_at,
            }
        except Feedback.DoesNotExist:
            return None


class SubmissionListSerializer(serializers.ModelSerializer):
    student = StudentSerializer(many=False, read_only=True)

    class Meta:
        model = Submission
        fields = ["id", "assignment", "student", "status", "submitted_at"]


# ---------------------------------------------------------------------------
# Feedback serializers
# ---------------------------------------------------------------------------


class FeedbackSerializer(serializers.Serializer):
    text = serializers.CharField(required=False, allow_blank=True, default="")
    score = serializers.IntegerField(required=False, allow_null=True)
    accepted = serializers.BooleanField(required=False, default=False)
    files = serializers.ListField(
        child=serializers.FileField(), required=False, default=list
    )
    resource_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )

    def validate_score(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Score cannot be negative.")
        return value

    def validate_files(self, value):
        for f in value:
            if f.size > MAX_FILE_SIZE:
                raise serializers.ValidationError(
                    f"File '{f.name}' exceeds the 50 MB limit."
                )
            if f.content_type not in ALLOWED_MIME_TYPES:
                raise serializers.ValidationError(
                    f"File type '{f.content_type}' is not allowed."
                )
        return value

    def upsert(self, submission, teacher):
        """Create or fully overwrite the feedback for a submission."""
        text = self.validated_data.get("text", "")
        score = self.validated_data.get("score")
        accepted = self.validated_data.get("accepted", False)
        uploaded_files = self.validated_data.get("files", [])
        resource_ids = self.validated_data.get("resource_ids", [])

        feedback, created = Feedback.objects.get_or_create(
            submission=submission,
            defaults={"teacher": teacher},
        )
        feedback.teacher = teacher
        feedback.text = text
        feedback.score = score
        feedback.accepted = accepted
        feedback.save()

        if uploaded_files or resource_ids:
            feedback.files.clear()
            for uploaded_file in uploaded_files:
                resource = Resource.objects.create(
                    owner=teacher,
                    title=uploaded_file.name,
                    kind=Resource.Kind.FILE,
                    file=uploaded_file,
                    original_name=uploaded_file.name,
                    mime_type=uploaded_file.content_type,
                    size_bytes=uploaded_file.size,
                )
                feedback.files.add(resource)
            for rid in resource_ids:
                try:
                    resource = Resource.objects.get(id=rid, owner=teacher)
                    feedback.files.add(resource)
                except Resource.DoesNotExist:
                    pass

        submission.status = Submission.Status.GRADED
        submission.save(update_fields=["status"])

        return feedback
