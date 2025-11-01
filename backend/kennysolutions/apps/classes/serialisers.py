from datetime import datetime, timezone
from apps.user_accounts.models import ClassGroup
from backend.serializers import TeacherClassEventSerializer
from apps.user_accounts.serializers import StudentSerializer, ClassGroupUserSerializer
from rest_framework import serializers
from apps.subjects.models import Subject
from apps.classes.models import ClassEvent, TeachingResource
from apps.subjects.serializers import SubjectSerializer



# Define a serializer for the TeachingResource model
class TeachingResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeachingResource
        fields = ['file', 'class_event', 'name']

class ClassEventCreateSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())  # Allow passing subject as an ID
    resources = TeachingResourceSerializer(many=True, read_only=True)
    class_group = serializers.PrimaryKeyRelatedField(queryset=ClassGroup.objects.all(), allow_null=True, required=False)

    class Meta:
        model = ClassEvent
        fields = ['id', 'start_time', 'duration', 'subject', 'students', 'teachers', 'resources', 'class_group', 'name']
        read_only_fields = ['id']

class ClassEventDateOrderedSerializer(serializers.ModelSerializer):
    """
    Returns a list of ClassEvents grouped into their starting date, order by start time.
    Appends each event with a previous field representing if the event was past or future.
    """
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    subject = SubjectSerializer(many=False, read_only=True)
    resources = TeachingResourceSerializer(many=True, read_only=True)
    class_group = ClassGroupUserSerializer(read_only=True)
    previous = serializers.SerializerMethodField()

    def get_previous(self, obj):
        """
        Returns a boolean indicating whether the event is past or future.
        """
        if obj.start_time < datetime.now(timezone.utc):
            return True
        else:
            return False
    class Meta:
        model = ClassEvent
        fields = ['id', 'start_time', 'duration', 'subject', 'students', 'teachers', 'resources', 'previous', 'class_group', 'name']
        read_only_fields = ['id']


class ClassEventSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    subject = SubjectSerializer(read_only=True)
    resources = TeachingResourceSerializer(many=True, read_only=True)

    class Meta:
        model = ClassEvent
        fields = ['id', 'start_time', 'duration', 'subject', 'students', 'teachers', 'resources', 'name']
        read_only_fields = ['id']
