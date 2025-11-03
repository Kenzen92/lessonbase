from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress, EmailConfirmation, EmailConfirmationHMAC
from allauth.account import app_settings as allauth_settings
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.models import SocialAccount, SocialLogin
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from .auth_serializers import (
    RegisterSerializer,
    LoginSerializer,
    VerifyEmailSerializer,
    ResendVerificationSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer,
    UserSerializer,
    SocialAuthSerializer,
)
from apps.user_accounts.models import Teacher, Student
import requests

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user with email and password.
    Sends verification email automatically.
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        # Store user_type in request for adapter
        request.user_type = serializer.validated_data['user_type']
        
        # Create user
        user = serializer.save()
        
        # Send verification email
        # Create email address record
        email_address, created = EmailAddress.objects.get_or_create(
            user=user,
            email=user.email.lower(),
            defaults={'verified': False, 'primary': True}
        )
        if not created:
            email_address.verified = False
            email_address.primary = True
            email_address.save()
        
        # Send confirmation email
        email_address.send_confirmation(request)
        
        return Response({
            'message': 'Registration successful. Please check your email to verify your account.',
            'email': user.email,
            'user_type': serializer.validated_data['user_type']
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login with email and password.
    Returns authentication token on success.
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Get or create token
        token, created = Token.objects.get_or_create(user=user)
        
        # Get user type
        real_user = user.get_real_instance()
        user_type = 'teacher' if isinstance(real_user, Teacher) else 'student'
        
        return Response({
            'token': token.key,
            'user_type': user_type,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout user by deleting their auth token.
    """
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify email address using confirmation key.
    """
    serializer = VerifyEmailSerializer(data=request.data)
    if serializer.is_valid():
        key = serializer.validated_data['key']
        
        try:
            # Try to get confirmation
            email_confirmation = EmailConfirmation.objects.get(key=key)
            
            # Confirm the email
            email_confirmation.confirm(request)
            
            # Mark user as confirmed
            user = email_confirmation.email_address.user
            user.is_confirmed = True
            user.save()
            
            return Response({
                'message': 'Email successfully verified.',
                'email': email_confirmation.email_address.email
            }, status=status.HTTP_200_OK)
            
        except EmailConfirmation.DoesNotExist:
            return Response({
                'error': 'Invalid verification key.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification(request):
    """
    Resend verification email to user.
    """
    serializer = ResendVerificationSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            
            # Check if already verified
            email_address = EmailAddress.objects.filter(user=user, email=email).first()
            if email_address and email_address.verified:
                return Response({
                    'message': 'This email is already verified.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create or get email address record
            if not email_address:
                email_address = EmailAddress.objects.create(
                    user=user,
                    email=email,
                    verified=False,
                    primary=True
                )
            
            # Send verification email
            email_address.send_confirmation(request)
            
            return Response({
                'message': 'Verification email sent successfully.'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found.'
            }, status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    Request password reset email.
    """
    serializer = PasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            
            # Generate reset token
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            
            # Create reset URL (pointing to frontend)
            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password/{uid}/{token}"
            
            # Send email
            subject = 'Password Reset Request'
            message = f'''
Hello,

You requested a password reset. Click the link below to reset your password:

{reset_url}

If you didn't request this, please ignore this email.

Best regards,
The LessonBase Team
            '''
            
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'Password reset email sent successfully.'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Don't reveal whether user exists or not
            return Response({
                'message': 'If an account exists with this email, a password reset link has been sent.'
            }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """
    Confirm password reset with new password.
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
            
            # Check token validity
            if default_token_generator.check_token(user, serializer.validated_data['token']):
                # Set new password
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                
                return Response({
                    'message': 'Password has been reset successfully.'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid or expired reset token.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                'error': 'Invalid reset link.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """
    Login/Register with Google OAuth.
    Accepts either:
    - access_token: Google OAuth access token
    - credential: Google JWT credential from Google Sign-In
    """
    serializer = SocialAuthSerializer(data=request.data)
    if serializer.is_valid():
        access_token = serializer.validated_data.get('access_token')
        credential = serializer.validated_data.get('credential')
        user_type = serializer.validated_data.get('user_type', 'student')
        
        # Store user_type in request for adapter
        request.user_type = user_type
        
        try:
            google_data = None
            
            # Handle JWT credential (from @react-oauth/google)
            if credential:
                # Verify the JWT with Google
                google_response = requests.get(
                    'https://oauth2.googleapis.com/tokeninfo',
                    params={'id_token': credential}
                )
                
                if google_response.status_code != 200:
                    return Response({
                        'error': 'Invalid Google credential.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                google_data = google_response.json()
                
            # Handle access_token (legacy or alternative flow)
            elif access_token:
                # Verify the token with Google
                google_response = requests.get(
                    'https://www.googleapis.com/oauth2/v1/userinfo',
                    params={'access_token': access_token}
                )
                
                if google_response.status_code != 200:
                    return Response({
                        'error': 'Invalid Google access token.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                google_data = google_response.json()
            else:
                return Response({
                    'error': 'Either access_token or credential is required.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            email = google_data.get('email', '').lower()
            
            if not email:
                return Response({
                    'error': 'Email not provided by Google.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user exists
            user_created = False
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Create new user
                user_created = True
                if user_type == 'teacher':
                    user = Teacher.objects.create(
                        email=email,
                        username=email,
                        first_name=google_data.get('given_name', ''),
                        last_name=google_data.get('family_name', ''),
                        is_confirmed=True,  # Google accounts are pre-verified
                    )
                else:
                    user = Student.objects.create(
                        email=email,
                        username=email,
                        first_name=google_data.get('given_name', ''),
                        last_name=google_data.get('family_name', ''),
                        is_confirmed=True,  # Google accounts are pre-verified
                    )
                
                # Mark email as verified
                email_address, created = EmailAddress.objects.get_or_create(
                    user=user,
                    email=email,
                    defaults={'verified': True, 'primary': True}
                )
                if not created:
                    email_address.verified = True
                    email_address.primary = True
                    email_address.save()
            
            # Create or get social account
            social_account, created = SocialAccount.objects.get_or_create(
                user=user,
                provider='google',
                defaults={
                    'uid': google_data.get('sub', google_data.get('id', '')),
                    'extra_data': google_data
                }
            )
            
            # Get or create token
            token, created = Token.objects.get_or_create(user=user)
            
            # Get user type
            real_user = user.get_real_instance()
            actual_user_type = 'teacher' if isinstance(real_user, Teacher) else 'student'
            
            return Response({
                'token': token.key,
                'user_type': actual_user_type,
                'user': UserSerializer(user).data,
                'is_new_user': user_created
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Google authentication failed: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Get current authenticated user information.
    """
    user = request.user.get_real_instance()
    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)
