from urllib.parse import quote

from django.conf import settings
from storages.backends.s3 import S3Storage


class R2MediaStorage(S3Storage):
    file_overwrite = False

    def url(self, name, parameters=None, expire=None, http_method=None):
        if not name:
            return ""

        if name.startswith(("http://", "https://", "/media/")):
            return name

        quoted_name = quote(name.lstrip("/"), safe="/")
        return f"{settings.BASE_URL.rstrip('/')}/media/{quoted_name}"
