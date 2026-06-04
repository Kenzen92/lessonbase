from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class Tag(models.Model):
    """
    A lightweight, polymorphic label that can attach to any model via TaggedItem.

    `kind` distinguishes tags that carry first-class meaning (e.g. a subject) from
    free-form general tags, while keeping them all in one vocabulary so a single
    <TagField> and a single filter UI can drive everything.
    """

    class Kind(models.TextChoices):
        SUBJECT = "subject", "Subject"
        GENERAL = "general", "General"

    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, null=True, blank=True)
    kind = models.CharField(
        max_length=20, choices=Kind.choices, default=Kind.GENERAL
    )

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "kind"], name="uniq_tag_name_kind"
            )
        ]

    def __str__(self):
        return self.name


class TaggedItem(models.Model):
    """Generic join attaching a Tag to any model instance (content_type + object_id)."""

    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name="items")
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["tag", "content_type", "object_id"],
                name="uniq_taggeditem",
            )
        ]
        indexes = [models.Index(fields=["content_type", "object_id"])]

    def __str__(self):
        return f"{self.tag} → {self.content_type} #{self.object_id}"
