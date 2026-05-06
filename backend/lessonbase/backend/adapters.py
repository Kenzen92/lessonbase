from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.contrib.auth import get_user_model
from apps.user_accounts.models import Student, Teacher

User = get_user_model()


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom account adapter for API-only authentication.
    Overrides form-based behavior to work with REST API.
    """

    def is_open_for_signup(self, request):
        """
        Allow signups
        """
        return True

    def send_mail(self, template_prefix, email, context):
        """
        Override to customize email sending with frontend URLs
        """
        # Add frontend URL to context for email templates
        context["frontend_url"] = settings.FRONTEND_URL
        return super().send_mail(template_prefix, email, context)

    def get_email_confirmation_url(self, request, emailconfirmation):
        """
        Constructs the email confirmation URL that points to the frontend.
        The frontend will then call the backend API to confirm.
        """
        # Return frontend URL with confirmation key
        url = f"{settings.FRONTEND_URL}/auth/verify-email/{emailconfirmation.key}"
        return url

    def respond_email_verification_sent(self, request, user):
        """
        Override to prevent redirect responses (for API use)
        """
        pass

    def save_user(self, request, user, form=None, commit=True):
        """
        Custom user save logic.
        Since we're using polymorphic models (Teacher/Student),
        this method handles the creation appropriately.
        """
        # Get user_type from request data if available
        user_type = getattr(request, "user_type", None)

        if user_type == "teacher":
            # If it's a teacher, ensure we're working with Teacher model
            if not isinstance(user, Teacher):
                # Convert to Teacher
                user = Teacher(
                    email=user.email,
                    username=user.username if user.username else user.email,
                )
        elif user_type == "student":
            # If it's a student, ensure we're working with Student model
            if not isinstance(user, Student):
                # Convert to Student
                user = Student(
                    email=user.email,
                    username=user.username if user.username else user.email,
                )

        # Set username to email if not provided
        if not user.username:
            user.username = user.email

        if commit:
            user.save()

        return user


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom social account adapter for handling Google OAuth
    """

    def is_open_for_signup(self, request, sociallogin):
        """
        Allow social signups
        """
        return True

    def pre_social_login(self, request, sociallogin):
        """
        Invoked just after a user successfully authenticates via a social provider,
        but before the login is actually processed.
        We use this to connect social accounts to existing users.
        """
        # If user is already logged in, connect the social account
        if request.user.is_authenticated:
            return

        # Check if user exists with this email
        try:
            email = sociallogin.account.extra_data.get("email", "").lower()
            if email:
                user = User.objects.get(email=email)
                sociallogin.connect(request, user)
        except User.DoesNotExist:
            pass

    def save_user(self, request, sociallogin, form=None):
        """
        Save a new user created via social authentication.
        Creates either Teacher or Student based on user_type in request.
        """
        user = sociallogin.user

        # Get user_type from request if available
        user_type = getattr(request, "user_type", "student")  # Default to student

        # Get email from social account
        email = sociallogin.account.extra_data.get("email", "")

        if user_type == "teacher":
            user = Teacher(
                email=email,
                username=email,
                first_name=sociallogin.account.extra_data.get("given_name", ""),
                last_name=sociallogin.account.extra_data.get("family_name", ""),
            )
        else:
            user = Student(
                email=email,
                username=email,
                first_name=sociallogin.account.extra_data.get("given_name", ""),
                last_name=sociallogin.account.extra_data.get("family_name", ""),
            )

        # Social accounts are pre-verified
        user.is_confirmed = True
        user.save()

        # Connect the social account
        sociallogin.user = user
        sociallogin.save(request)

        return user

    def populate_user(self, request, sociallogin, data):
        """
        Populate user information from social provider data
        """
        user = sociallogin.user
        user.email = data.get("email", "").lower()
        user.username = user.email
        user.first_name = data.get("given_name", "")
        user.last_name = data.get("family_name", "")
        return user
