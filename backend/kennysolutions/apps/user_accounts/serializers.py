from apps.user_accounts.models import ClassGroup, CustomerAccount, Teacher, Student, Staff
from rest_framework import serializers
from apps.subjects.models import Subject
from apps.subjects.serializers import SubjectSerializer
from django.contrib.auth.models import AbstractUser

userModel = CustomerAccount()

class ClassGroupUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassGroup
        fields = ['id', 'name']


class StudentSerializer(serializers.ModelSerializer):
    class_groups = ClassGroupUserSerializer(many=True, read_only=True)
    class Meta:
        model = Student
        fields = ['id', 'username', 'first_name', 'last_name', 'enrollment_date', 'profile_picture', 'class_groups']

class TeacherSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)

    class Meta:
        model = Teacher
        fields = ['id', 'username', 'subjects', 'students', 'first_name', 'last_name', 'email', 'profile_picture']
        read_only_fields = ['id', 'students']

class CustomerAccountSerializer(serializers.ModelSerializer):
    user_type = serializers.ChoiceField(choices=[(1, 'Teacher'), (2, 'Student'), (3, 'Staff')], write_only=True)
    subjects = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), many=True, write_only=True)

    class Meta:
        model = CustomerAccount
        fields = ('id', 'username', 'password', 'user_type', 'subjects')


        
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
            user = CustomerAccount.objects.get(username=username)
        except CustomerAccount.DoesNotExist:
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
    class Meta:
        model = ClassGroup
        fields = ['id', 'name', 'description', 'class_code', 'students']
        read_only_fields = ['id']