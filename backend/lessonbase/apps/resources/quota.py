"""Account-level storage quota helpers.

Usage counts active (non-soft-deleted) file resources, so soft-deleting a
resource frees quota immediately. A restore can push an account back over
its limit; when that happens further uploads are blocked until usage drops
below the limit again.
"""

from django.db.models import Sum
from rest_framework import serializers

from apps.resources.models import MAX_FILE_SIZE

TEACHER_STORAGE_LIMIT = 150 * 1024 * 1024  # 150 MB
STUDENT_STORAGE_LIMIT = 20 * 1024 * 1024  # 20 MB


def _human_mb(num_bytes):
    return f"{num_bytes / (1024 * 1024):.0f} MB"


def storage_limit_for(user):
    from apps.user_accounts.models import Student

    real = user.get_real_instance() if hasattr(user, "get_real_instance") else user
    if isinstance(real, Student):
        return STUDENT_STORAGE_LIMIT
    return TEACHER_STORAGE_LIMIT


def storage_used(user):
    from apps.resources.models import Resource

    return (
        Resource.objects.filter(owner_id=user.pk).aggregate(total=Sum("size_bytes"))[
            "total"
        ]
        or 0
    )


def upload_violation(user, files):
    """Return an error message if `files` break the per-file or account limit.

    Returns None when the upload is allowed. `files` may contain None entries
    (callers pass request.FILES.get(...) results directly).
    """
    files = [f for f in files if f is not None]
    if not files:
        return None

    for f in files:
        if f.size > MAX_FILE_SIZE:
            return (
                f"'{f.name}' is too large. Individual files are limited to "
                f"{_human_mb(MAX_FILE_SIZE)}."
            )

    incoming = sum(f.size for f in files)
    used = storage_used(user)
    limit = storage_limit_for(user)
    if used + incoming > limit:
        remaining = max(limit - used, 0)
        return (
            f"Not enough storage space. This upload needs "
            f"{_human_mb(incoming)} but only {_human_mb(remaining)} of your "
            f"{_human_mb(limit)} allowance is free."
        )
    return None


def validate_upload(user, files):
    """Serializer-friendly wrapper: raise ValidationError on any violation."""
    message = upload_violation(user, files)
    if message:
        raise serializers.ValidationError(message)
