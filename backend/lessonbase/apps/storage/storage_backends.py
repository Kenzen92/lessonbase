from urllib.parse import quote

from django.conf import settings
from storages.backends.s3 import S3Storage


class R2MediaStorage(S3Storage):
    # Unique keys per upload (no overwrite) — which is what makes the
    # `immutable` cache directive below safe: a given URL never changes content.
    file_overwrite = False

    # Cache headers written onto every object at upload time. When media is
    # served directly from R2 / a CDN custom domain (see `url()` below) these
    # are the only cache headers the browser sees, so set them at the source.
    object_parameters = {"CacheControl": "public, max-age=31536000, immutable"}

    def url(self, name, parameters=None, expire=None, http_method=None):
        if not name:
            return ""

        # Already an absolute URL (e.g. a stored external link) — pass through.
        if name.startswith(("http://", "https://")):
            return name

        # Already a proxied media path — pass through.
        if name.startswith("/media/"):
            return name

        quoted_name = quote(name.lstrip("/"), safe="/")

        # Preferred path: serve straight from R2 / CDN custom domain, bypassing
        # Django and nginx entirely. Activated by setting MEDIA_PUBLIC_BASE_URL.
        public_base = getattr(settings, "MEDIA_PUBLIC_BASE_URL", "") or ""
        if public_base:
            return f"{public_base.rstrip('/')}/{quoted_name}"

        # Fallback: proxy the bytes through Django's /media/ view. Used in
        # local dev, tests, and any environment without a public media domain.
        return f"{settings.BASE_URL.rstrip('/')}/media/{quoted_name}"
