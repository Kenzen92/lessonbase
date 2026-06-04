"""Helpers for reading and writing tags on any taggable model."""
from django.contrib.contenttypes.models import ContentType
from apps.tags.models import Tag, TaggedItem


def normalize_tag_specs(specs):
    """
    Accept the loose shapes the frontend may send and normalise to a list of
    { name, color, kind } dicts. Supported inputs per item:
      - a plain string -> { name }
      - an int / a { "id": n } -> resolved to an existing tag's name/kind
      - a { name, color?, kind? } dict
    """
    normalized = []
    for spec in specs or []:
        if isinstance(spec, str):
            name = spec.strip()
            if name:
                normalized.append({"name": name})
        elif isinstance(spec, int):
            tag = Tag.objects.filter(id=spec).first()
            if tag:
                normalized.append({"name": tag.name, "color": tag.color, "kind": tag.kind})
        elif isinstance(spec, dict):
            if "id" in spec and "name" not in spec:
                tag = Tag.objects.filter(id=spec["id"]).first()
                if tag:
                    normalized.append(
                        {"name": tag.name, "color": tag.color, "kind": tag.kind}
                    )
                continue
            name = (spec.get("name") or "").strip()
            if name:
                normalized.append(
                    {
                        "name": name,
                        "color": spec.get("color"),
                        "kind": spec.get("kind", Tag.Kind.GENERAL),
                    }
                )
    return normalized


def get_or_create_tag(name, color=None, kind=Tag.Kind.GENERAL):
    tag, created = Tag.objects.get_or_create(
        name=name, kind=kind, defaults={"color": color}
    )
    if not created and color and not tag.color:
        tag.color = color
        tag.save(update_fields=["color"])
    return tag


def set_tags(obj, specs):
    """Replace the tag set on `obj` with the given specs (idempotent)."""
    ct = ContentType.objects.get_for_model(obj)
    desired = []
    for spec in normalize_tag_specs(specs):
        desired.append(
            get_or_create_tag(
                spec["name"], spec.get("color"), spec.get("kind", Tag.Kind.GENERAL)
            )
        )
    desired_ids = {t.id for t in desired}

    existing = TaggedItem.objects.filter(content_type=ct, object_id=obj.pk)
    existing.exclude(tag_id__in=desired_ids).delete()
    existing_ids = set(existing.values_list("tag_id", flat=True))
    for tag in desired:
        if tag.id not in existing_ids:
            TaggedItem.objects.get_or_create(
                tag=tag, content_type=ct, object_id=obj.pk
            )


def add_tag(obj, name, color=None, kind=Tag.Kind.GENERAL):
    """Attach a single tag to `obj` without disturbing its other tags."""
    ct = ContentType.objects.get_for_model(obj)
    tag = get_or_create_tag(name, color, kind)
    TaggedItem.objects.get_or_create(tag=tag, content_type=ct, object_id=obj.pk)
    return tag


def tags_for(obj):
    """Return the Tag queryset attached to `obj`."""
    ct = ContentType.objects.get_for_model(obj)
    tag_ids = TaggedItem.objects.filter(
        content_type=ct, object_id=obj.pk
    ).values_list("tag_id", flat=True)
    return Tag.objects.filter(id__in=list(tag_ids))
