from django.urls import path, include

from apps.classes.views import (
    ClassEventViewSet,
    class_material,
    class_report,
    student_statistics,
    teacher_statistics,
    class_events_for_student,
    validate_classroom_access,
    create_practice_classroom,
    cleanup_expired_classrooms,
)
from apps.user_accounts.views import (
    ClassGroupViewSet,
    TeacherViewSet,
    StudentViewSet,
    confirm_account,
    login,
    logout,
    profile,
    auth_user,
)
from apps.subjects.views import all_subjects, subjects
from apps.assignments.views import (
    AssignmentAttemptViewSet,
    AssignmentViewSet,
    FeedbackViewSet,
)
from . import views
from .auth_views import (
    register,
    login_view,
    logout_view,
    verify_email,
    resend_verification,
    password_reset_request,
    password_reset_confirm,
    google_login,
    current_user,
)
from rest_framework.routers import DefaultRouter

from apps.storage.views import serve_media_file

router = DefaultRouter()
router.register(r"assignment", AssignmentViewSet, basename="assignment")
router.register(r"class-group", ClassGroupViewSet, basename="class-group")
router.register(r"class-event", ClassEventViewSet, basename="class-event")
router.register(r"student", StudentViewSet, basename="student")
router.register(r"teacher", TeacherViewSet, basename="teacher")
router.register(
    r"assignment-attempt", AssignmentAttemptViewSet, basename="assignment-attempt"
)
router.register(r"feedback", FeedbackViewSet, basename="feedback")

urlpatterns = [
    # New allauth-based authentication endpoints
    path("auth/register/", register, name="auth_register"),
    path("auth/login/", login_view, name="auth_login"),
    path("auth/logout/", logout_view, name="auth_logout"),
    path("auth/verify-email/", verify_email, name="auth_verify_email"),
    path(
        "auth/resend-verification/",
        resend_verification,
        name="auth_resend_verification",
    ),
    path("auth/password-reset/", password_reset_request, name="auth_password_reset"),
    path(
        "auth/password-reset-confirm/",
        password_reset_confirm,
        name="auth_password_reset_confirm",
    ),
    path("auth/google/", google_login, name="auth_google"),
    path("auth/user/", current_user, name="auth_current_user"),
    # Legacy endpoints (keeping for backward compatibility, but consider deprecating)
    path("login", login, name="legacy_login"),
    path("logout/", logout, name="legacy_logout"),
    # Other endpoints
    path("profile/", profile),
    path("class-event/student/<int:student_id>/", class_events_for_student),
    path("subjects/all", all_subjects),
    path("subjects/", subjects),
    path("confirm-account/", confirm_account, name="confirm_account"),
    path("chats/", views.ChatListCreateView.as_view(), name="chat-list-create"),
    path(
        "chats/<int:chat_id>/messages/",
        views.MessageListCreateView.as_view(),
        name="message-list-create",
    ),
    path("class_report", class_report, name="open-api"),
    path("class_material", class_material, name="open-api"),
    path("media/<path:file_path>", serve_media_file, name="serve_media_file"),
    path("teacher-statistics", teacher_statistics, name="teacher_statistics"),
    path("student-statistics", student_statistics, name="student_statistics"),
    # Classroom access and security endpoints
    path(
        "classroom/validate/<str:access_token>/",
        validate_classroom_access,
        name="validate_classroom_access",
    ),
    path(
        "classroom/practice/create/",
        create_practice_classroom,
        name="create_practice_classroom",
    ),
    path(
        "classroom/cleanup/",
        cleanup_expired_classrooms,
        name="cleanup_expired_classrooms",
    ),
    path("health/", views.HealthCheckView.as_view(), name="health_check"),
    path("", include(router.urls)),
]
