from apps.user_accounts.models import (
    ClassGroup,
    CustomAccount,
    MarketingPreferences,
    Teacher,
    Student,
    Staff,
)
from rest_framework import serializers
from apps.subjects.models import Subject
from apps.subjects.serializers import SubjectSerializer
from apps.tags.serializers import TagSerializer
from apps.tags.utils import set_tags, tags_for
from django.contrib.auth.models import AbstractUser

userModel = CustomAccount()


class ClassGroupUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassGroup
        fields = ["id", "name", "color"]


class StudentSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    class_groups = ClassGroupUserSerializer(many=True, read_only=True)
    user_type = serializers.SerializerMethodField()

    def get_user_type(self, obj):
        return obj.__class__.__name__

    class Meta:
        model = Student
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "enrollment_date",
            "profile_picture",
            "class_groups",
            "user_type",
            "subjects",
        ]


class StudentProfileSerializer(StudentSerializer):
    """StudentSerializer plus the email address. Used where the reader is
    entitled to it — the student's own profile and the teacher's student
    directory — while embedded rosters (class groups, assignments) keep the
    email-free base serializer so classmates only see names and avatars."""

    class Meta(StudentSerializer.Meta):
        fields = StudentSerializer.Meta.fields + ["email"]


class TeacherDetailSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    user_type = serializers.SerializerMethodField()

    def get_user_type(self, obj):
        return obj.__class__.__name__

    class Meta:
        model = Teacher
        fields = [
            "id",
            "username",
            "subjects",
            "students",
            "first_name",
            "last_name",
            "email",
            "profile_picture",
            "user_type",
        ]
        read_only_fields = ["id", "students"]


class TeacherUpdateSerializer(serializers.ModelSerializer):
    subjects = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), many=True
    )

    class Meta:
        model = Teacher
        fields = [
            "username",
            "subjects",
            "first_name",
            "last_name",
            "email",
            "profile_picture",
        ]


class TeacherDirectorySerializer(serializers.ModelSerializer):
    """What a student may see about their teachers: contact details and
    subjects, but never the teacher's full student roster."""

    subjects = SubjectSerializer(many=True, read_only=True)

    class Meta:
        model = Teacher
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "profile_picture",
            "subjects",
        ]


class CustomAccountSerializer(serializers.ModelSerializer):
    user_type = serializers.ChoiceField(
        choices=[(1, "teacher"), (2, "student"), (3, "staff")], write_only=True
    )

    class Meta:
        model = CustomAccount
        fields = (
            "id",
            "username",
            "password",
            "user_type",
            "subjects",
            "first_name",
            "last_name",
            "email",
        )


class MarketingPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketingPreferences
        fields = ["product_updates", "tips_and_tutorials", "promotions"]


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = "__all__"


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")
        print(username, password)
        try:
            user = CustomAccount.objects.get(username=username)
        except CustomAccount.DoesNotExist:
            raise serializers.ValidationError("Invalid username or password")
        user.get_real_instance()
        validated = user.check_password(password)

        if not validated:
            raise serializers.ValidationError(
                f"User: {user}, password: {password}, username: {username}, Invalid username or password"
            )

        # You can add additional validation logic here if needed

        return user


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbstractUser
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
        ]  # Add any other fields you need


class ClassGroupCreateSerializer(serializers.ModelSerializer):
    students = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), many=True, required=False, allow_empty=True
    )
    subjects = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), many=True, required=False, allow_empty=True
    )
    class_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tags = serializers.ListField(required=False, default=list, write_only=True)

    class Meta:
        model = ClassGroup
        fields = [
            "id",
            "name",
            "description",
            "class_code",
            "students",
            "teachers",
            "subjects",
            "color",
            "tags",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        group = super().create(validated_data)
        set_tags(group, tags)
        return group

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        group = super().update(instance, validated_data)
        if tags is not None:
            set_tags(group, tags)
        return group


class ClassGroupDetailsSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherDirectorySerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()

    class Meta:
        model = ClassGroup
        fields = [
            "id",
            "name",
            "description",
            "class_code",
            "students",
            "teachers",
            "subjects",
            "color",
            "tags",
        ]
        read_only_fields = ["id"]

    def get_tags(self, obj):
        return TagSerializer(tags_for(obj), many=True).data


class ClassGroupListSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    students = StudentSerializer(many=True, read_only=True)
    teachers = TeacherDirectorySerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()

    class Meta:
        model = ClassGroup
        fields = [
            "id",
            "name",
            "description",
            "class_code",
            "students",
            "teachers",
            "subjects",
            "color",
            "tags",
        ]

    def get_tags(self, obj):
        return TagSerializer(tags_for(obj), many=True).data
        read_only_fields = ["id"]
