from django.db import models
from django.utils import timezone

from apps.subjects.models import Subject
from apps.user_accounts.models import CustomUser

ALLOWED_MIME_TYPES = frozenset([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
    "image/bmp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


class ActiveResourceManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class ResourceTag(models.Model):
    owner = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="resource_tags"
    )
    name = models.CharField(max_length=50)

    class Meta:
        unique_together = ("owner", "name")

    def __str__(self):
        return self.name


class Resource(models.Model):
    class Kind(models.TextChoices):
        FILE = "file", "File"
        LINK = "link", "Link"

    # Default manager excludes soft-deleted rows; all_objects includes them.
    objects = ActiveResourceManager()
    all_objects = models.Manager()

    owner = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="resources"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(max_length=1000, blank=True)
    kind = models.CharField(max_length=8, choices=Kind.choices, default=Kind.FILE)

    # file kind
    file = models.FileField(upload_to="resources/", null=True, blank=True)
    original_name = models.CharField(max_length=255, blank=True)
    mime_type = models.CharField(max_length=120, blank=True)
    size_bytes = models.PositiveBigIntegerField(null=True, blank=True)

    # link kind
    url = models.URLField(blank=True)

    # organisation
    subject = models.ForeignKey(
        Subject,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resources",
    )
    tags = models.ManyToManyField(ResourceTag, blank=True, related_name="resources")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])


class ClassResource(models.Model):
    """Links a Resource to a ClassEvent — the join table for class materials."""

    class_event = models.ForeignKey(
        "classes.ClassEvent",
        on_delete=models.CASCADE,
        related_name="resource_links",
    )
    resource = models.ForeignKey(
        Resource,
        on_delete=models.CASCADE,
        related_name="class_links",
    )
    added_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("class_event", "resource")

    def __str__(self):
        return f"{self.resource.title} → {self.class_event}"


class AssignmentMaterial(models.Model):
    """Links a Resource to an Assignment — the join table for assignment worksheets."""

    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        related_name="material_links",
    )
    resource = models.ForeignKey(
        Resource,
        on_delete=models.CASCADE,
        related_name="assignment_links",
    )

    class Meta:
        unique_together = ("assignment", "resource")

    def __str__(self):
        return f"{self.resource.title} → {self.assignment}"
