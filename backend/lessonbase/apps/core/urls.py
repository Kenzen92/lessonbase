from django.urls import path, include

from apps.classes.views import (
    ClassEventViewSet,
    SessionFeedbackViewSet,
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
    marketing_preferences,
    profile,
    auth_user,
)
from apps.subjects.views import all_subjects, subjects
from apps.assignments.views import AssignmentViewSet, SubmissionViewSet
from apps.tags.views import TagListCreateView
from apps.resources.views import ResourceViewSet, ResourceTagViewSet, ClassEventResourcesViewSet
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
router.register(r"submission", SubmissionViewSet, basename="submission")
router.register(r"session-feedback", SessionFeedbackViewSet, basename="session-feedback")
router.register(r"resources", ResourceViewSet, basename="resources")
router.register(r"resource-tags", ResourceTagViewSet, basename="resource-tags")

urlpatterns = [
    # Tags
    path("tags/", TagListCreateView.as_view(), name="tags"),
    # Authentication
    path("auth/register/", register, name="auth_register"),
    path("auth/login/", login_view, name="auth_login"),
    path("auth/logout/", logout_view, name="auth_logout"),
    path("auth/verify-email/", verify_email, name="auth_verify_email"),
    path("auth/resend-verification/", resend_verification, name="auth_resend_verification"),
    path("auth/password-reset/", password_reset_request, name="auth_password_reset"),
    path("auth/password-reset-confirm/", password_reset_confirm, name="auth_password_reset_confirm"),
    path("auth/google/", google_login, name="auth_google"),
    path("auth/user/", current_user, name="auth_current_user"),

    # Legacy auth (kept for backward compatibility)
    path("login/", login, name="legacy_login"),
    path("logout/", logout, name="legacy_logout"),

    # Other endpoints
    path("profile/", profile),
    path("marketing-preferences/", marketing_preferences, name="marketing_preferences"),
    path("class-event/student/<int:student_id>/", class_events_for_student),
    path("subjects/all/", all_subjects),
    path("subjects/", subjects),
    path("confirm-account/", confirm_account, name="confirm_account"),
    path("chats/", views.ChatListCreateView.as_view(), name="chat-list-create"),
    path("chats/<int:chat_id>/messages/", views.MessageListCreateView.as_view(), name="message-list-create"),
    path("class_report/", class_report, name="class_report"),
    path("media/<path:file_path>", serve_media_file, name="serve_media_file"),
    path("teacher-statistics/", teacher_statistics, name="teacher_statistics"),
    path("student-statistics/", student_statistics, name="student_statistics"),

    # Class event resource management (nested under class-event)
    path(
        "class-event/<int:class_event_pk>/resources/",
        ClassEventResourcesViewSet.as_view({"get": "list", "post": "create"}),
        name="class-event-resources-list",
    ),
    path(
        "class-event/<int:class_event_pk>/resources/<int:pk>/",
        ClassEventResourcesViewSet.as_view({"delete": "destroy"}),
        name="class-event-resources-detail",
    ),

    # Classroom security endpoints
    path("classroom/validate/<str:access_token>/", validate_classroom_access, name="validate_classroom_access"),
    path("classroom/practice/create/", create_practice_classroom, name="create_practice_classroom"),
    path("classroom/cleanup/", cleanup_expired_classrooms, name="cleanup_expired_classrooms"),

    path("health/", views.HealthCheckView.as_view(), name="health_check"),
    path("", include(router.urls)),
]
