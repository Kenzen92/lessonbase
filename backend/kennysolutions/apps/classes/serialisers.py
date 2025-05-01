from datetime import datetime, timezone
from backend.serializers import TeacherClassEventSerializer
from apps.user_accounts.serializers import ClassGroupListSerializer, StudentSerializer
from rest_framework import serializers
from apps.subjects.models import Subject
from apps.user_accounts.models import ClassGroup, CustomUser, CustomAccount, Teacher, Student, Staff
from apps.classes.models import Assignment, AssignmentAttempt, ClassEvent, TeachingResource
from apps.subjects.serializers import SubjectSerializer
from django.contrib.auth import authenticate
import logging
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractUser


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

    class Meta:
        model = ClassEvent
        fields = ['id', 'start_time', 'duration', 'subject', 'students', 'teachers', 'resources']
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
        fields = ['id', 'start_time', 'duration', 'subject', 'students', 'teachers', 'resources', 'previous']
        read_only_fields = ['id']


class ClassEventSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherClassEventSerializer(many=True, read_only=True)
    subject = SubjectSerializer(many=False, read_only=True)
    resources = TeachingResourceSerializer(many=True, read_only=True)

    class Meta:
        model = ClassEvent
        fields = ['id', 'start_time', 'duration', 'subject', 'students', 'teachers', 'resources']
        read_only_fields = ['id']


class AssignmentListSerializer(serializers.ModelSerializer):
    # Use PrimaryKeyRelatedField for ForeignKey and ManyToMany fields to support both read and write operations
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    teachers = serializers.PrimaryKeyRelatedField(queryset=Teacher.objects.all(), many=True)
    students = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), many=True)

    class Meta:
        model = Assignment
        fields = [
            'id',
            'title',
            'description',
            'subject',
            'teachers',
            'max_score',
            'created_at',
            'due_date',
            'students',
        ]

class AssignmentCreateSerializer(serializers.ModelSerializer):
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all()),
    max_score = serializers.IntegerField()
    due_date = serializers.DateField(),
    students = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), many=True)
    material = serializers.ListField(
        child=serializers.FileField(), write_only=True, required=False
    )

    class Meta:
        model = Assignment
        fields = ['title', 'description', 'subject', 'max_score', 'due_date', 'students', 'material']


    def create(self, validated_data):
        uploaded_files = validated_data.pop('material', [])
        students = validated_data.pop('students', [])
        teacher = self.context["request"].user.get_real_instance()
        assignment = Assignment.objects.create(**validated_data)
        assignment.teachers.set([teacher])
        assignment.students.set(students)

        teaching_resources = []
        for file in uploaded_files:
            resource = TeachingResource.objects.create(file=file)
            teaching_resources.append(resource)

        assignment.material.set(teaching_resources)
        return assignment

class AssignmentDetailsSerializer(serializers.ModelSerializer):
    # Use PrimaryKeyRelatedField for ForeignKey and ManyToMany fields to support both read and write operations
    subject = SubjectSerializer(many=False)
    teachers = serializers.PrimaryKeyRelatedField(queryset=Teacher.objects.all(), many=True)
    students = StudentSerializer(many=True)

    class Meta:
        model = Assignment
        fields = [
            'title',
            'description',
            'subject',
            'teachers',
            'max_score',
            'created_at',
            'due_date',
            'students',
        ]

class AssignmentAttemptCreateSerializer(serializers.ModelSerializer):
    answer_text = serializers.CharField(required=False, allow_blank=True)
    assignment = serializers.PrimaryKeyRelatedField(queryset=Assignment.objects.all())
    submitted_files = serializers.ListField(
        child=serializers.FileField(), required=False
    )
 
    def validate_assignment_id(self, value):
        if not Assignment.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid assignment ID.")
        return value

    def create(self, validated_data):
        request_user = self.context["request"].user.get_real_instance()

        # if not hasattr(request_user, "student"):
        #     raise serializers.ValidationError("Only students can submit assignments.")

        assignment = validated_data["assignment"]
        attempt = AssignmentAttempt.objects.create(
            assignment=assignment,
            answer_text=validated_data.get("answer_text", ""),
            # student = self.context["request"].user 
            student = Student.objects.last()
        )

        for file in validated_data.get("files", []):
            attempt.submitted_files.create(file=file)  # assuming a related model for files

        return attempt
    
    class Meta:
        model = AssignmentAttempt
        fields = ['answer_text', 'submitted_files', 'assignment']

class AssignmentAttemptDetailsSerializer(serializers.ModelSerializer):
    student = StudentSerializer(many=False, read_only=True)
    subject = SubjectSerializer(many=False, read_only=True)

    class Meta:
        model = AssignmentAttempt
        fields = '__all__'

class AssignmentAttemptListSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentAttempt
        fields = ['id', 'assignment', 'student', 'submitted_at', 'accepted', 'graded']
