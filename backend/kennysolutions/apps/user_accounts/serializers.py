from apps.user_accounts.models import ClassGroup, CustomAccount, Teacher, Student, Staff
from rest_framework import serializers
from apps.subjects.models import Subject
from apps.subjects.serializers import SubjectSerializer
from django.contrib.auth.models import AbstractUser

userModel = CustomAccount()

class ClassGroupUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassGroup
        fields = ['id', 'name']


class StudentSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    class_groups = ClassGroupUserSerializer(many=True, read_only=True)
    user_type = serializers.SerializerMethodField()
    

    def get_user_type(self, obj):
        return obj.__class__.__name__
    
    class Meta:
        model = Student
        fields = ['id', 'username', 'first_name', 'last_name', 'enrollment_date', 'profile_picture', 'class_groups', 'user_type', 'subjects']

class TeacherDetailSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    user_type = serializers.SerializerMethodField()

    def get_user_type(self, obj):
        return obj.__class__.__name__

    class Meta:
        model = Teacher
        fields = ['id', 'username', 'subjects', 'students', 'first_name', 'last_name', 'email', 'profile_picture', 'user_type']
        read_only_fields = ['id', 'students']

class TeacherUpdateSerializer(serializers.ModelSerializer):
    subjects = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), many=True)

    class Meta:
        model=Teacher
        fields = ['username', 'subjects', 'first_name', 'last_name', 'email', 'profile_picture']

class TeacherListSerializer(serializers.ModelSerializer):

    class Meta:
        model=Teacher
        fields = ['id', 'first_name', 'last_name']

class CustomAccountSerializer(serializers.ModelSerializer):
    user_type = serializers.ChoiceField(choices=[(1, 'teacher'), (2, 'student'), (3, 'staff')], write_only=True)


    class Meta:
        model = CustomAccount
        fields = ('id', 'username', 'password', 'user_type', 'subjects', 'first_name', 'last_name', 'email')


        
class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password' )
        print(username, password)
        try:
            user = CustomAccount.objects.get(username=username)
        except CustomAccount.DoesNotExist:
            raise serializers.ValidationError('Invalid username or password') 
        user.get_real_instance()
        validated = user.check_password(password)

        if not validated:
            raise serializers.ValidationError(f'User: {user}, password: {password}, username: {username}, Invalid username or password')

        # You can add additional validation logic here if needed

        return user
    
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbstractUser
        fields = ['id', 'username', 'first_name', 'last_name', 'email']  # Add any other fields you need


class ClassGroupCreateSerializer(serializers.ModelSerializer):
    students = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), many=True, required=False, allow_empty=True)
    class Meta:
        model = ClassGroup
        fields = ['id', 'name', 'description', 'class_code', 'students', 'teachers', 'subjects']
        read_only_fields = ['id']

class ClassGroupDetailsSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    students = StudentSerializer(many=True, read_only=True)
    class Meta:
        model = ClassGroup
        fields = ['id', 'name', 'description', 'class_code', 'students', 'teachers', 'subjects']
        read_only_fields = ['id']

class ClassGroupListSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    students = StudentSerializer(many=True, read_only=True)
    class Meta:
        model = ClassGroup
        fields = ['id', 'name', 'description', 'class_code', 'students', 'subjects']
        read_only_fields = ['id']