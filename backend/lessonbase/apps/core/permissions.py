from rest_framework.permissions import SAFE_METHODS, BasePermission


def _is_teacher(user):
    from apps.user_accounts.models import Teacher

    return isinstance(user.get_real_instance(), Teacher)


class IsTeacher(BasePermission):
    """Allows access only to Teacher accounts."""

    message = "Only teachers can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and _is_teacher(request.user)
        )


class IsTeacherOrReadOnly(BasePermission):
    """Any authenticated account may read; only teachers may write."""

    message = "Only teachers can perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return _is_teacher(request.user)
