from rest_framework import serializers
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress
from apps.user_accounts.models import Student, Teacher
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """
    Serializer for user registration via email/password
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    user_type = serializers.ChoiceField(choices=['student', 'teacher'], required=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    
    def validate_email(self, value):
        """
        Check that email is unique
        """
        email = value.lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email
    
    def validate(self, attrs):
        """
        Check that passwords match and are valid
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Validate password strength
        validate_password(attrs['password'])
        
        return attrs
    
    def create(self, validated_data):
        """
        Create user based on user_type
        """
        validated_data.pop('password_confirm')
        user_type = validated_data.pop('user_type')
        password = validated_data.pop('password')
        email = validated_data['email'].lower()
        
        # Create appropriate user type
        if user_type == 'teacher':
            user = Teacher.objects.create(
                email=email,
                username=email,
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
            )
        else:
            user = Student.objects.create(
                email=email,
                username=email,
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
            )
        
        user.set_password(password)
        user.save()
        
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for email/password login
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        """
        Validate credentials
        """
        email = attrs.get('email', '').lower()
        password = attrs.get('password', '')
        
        if email and password:
            # Try to authenticate
            try:
                user = User.objects.get(email=email)
                if not user.check_password(password):
                    raise serializers.ValidationError("Unable to log in with provided credentials.")
            except User.DoesNotExist:
                raise serializers.ValidationError("Unable to log in with provided credentials.")
            
            # Check if email is verified
            if not user.is_confirmed:
                # Check if they have a verified email via allauth
                email_address = EmailAddress.objects.filter(user=user, email=email).first()
                if not email_address or not email_address.verified:
                    raise serializers.ValidationError("Please verify your email before logging in.")
            
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled.")
            
            attrs['user'] = user
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")
        
        return attrs


class VerifyEmailSerializer(serializers.Serializer):
    """
    Serializer for email verification
    """
    key = serializers.CharField(required=True)


class ResendVerificationSerializer(serializers.Serializer):
    """
    Serializer for resending verification email
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """
        Check that user exists
        """
        email = value.lower()
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return email


class PasswordResetSerializer(serializers.Serializer):
    """
    Serializer for password reset request
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """
        Check that user exists
        """
        email = value.lower()
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return email


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation
    """
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    new_password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        """
        Check that passwords match and are valid
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        
        # Validate password strength
        validate_password(attrs['new_password'])
        
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user data
    """
    user_type = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'user_type', 'is_confirmed']
        read_only_fields = ['id', 'email', 'user_type', 'is_confirmed']
    
    def get_user_type(self, obj):
        """
        Get the polymorphic user type
        """
        real_instance = obj.get_real_instance()
        if isinstance(real_instance, Teacher):
            return 'teacher'
        elif isinstance(real_instance, Student):
            return 'student'
        return 'user'


class SocialAuthSerializer(serializers.Serializer):
    """
    Serializer for social authentication
    Accepts either access_token or credential (JWT from Google Sign-In)
    """
    access_token = serializers.CharField(required=False)
    credential = serializers.CharField(required=False)
    user_type = serializers.ChoiceField(choices=['student', 'teacher'], required=False, default='student')
    
    def validate(self, attrs):
        """
        Ensure at least one of access_token or credential is provided
        """
        if not attrs.get('access_token') and not attrs.get('credential'):
            raise serializers.ValidationError("Either 'access_token' or 'credential' must be provided.")
        return attrs
