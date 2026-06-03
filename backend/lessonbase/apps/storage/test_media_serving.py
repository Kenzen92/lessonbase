"""Tests guarding direct-from-R2 media serving.

Two layers:

* ``MediaUrlGenerationTests`` — fast, network-free unit tests that lock in the
  URL contract: with a public media domain configured we serve straight from
  R2/CDN; without one we fall back to the Django ``/media/`` proxy. These run
  on every CI build and are the regression guard against future changes
  accidentally routing media back through Django.
* ``R2DirectServingIntegrationTests`` — a real round-trip that uploads to R2
  and fetches the object over HTTP from its public URL. Skips (like the
  existing R2 integration test) when the bucket/public domain isn't configured.
"""

import uuid
from urllib.request import urlopen

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.test import SimpleTestCase, TestCase, override_settings

from apps.storage.storage_backends import R2MediaStorage

R2_BACKEND = "apps.storage.storage_backends.R2MediaStorage"


class MediaUrlGenerationTests(SimpleTestCase):
    @override_settings(
        MEDIA_PUBLIC_BASE_URL="https://media.example.test",
        BASE_URL="https://api.example.test",
    )
    def test_url_uses_public_base_when_configured(self):
        url = R2MediaStorage().url("resources/lesson plan.pdf")

        # Served straight from the CDN/R2 domain — Django is not in the path.
        self.assertEqual(
            url, "https://media.example.test/resources/lesson%20plan.pdf"
        )
        self.assertNotIn("/media/", url)

    @override_settings(
        MEDIA_PUBLIC_BASE_URL="",
        BASE_URL="https://api.example.test",
    )
    def test_url_falls_back_to_django_proxy_when_unset(self):
        url = R2MediaStorage().url("profile_pictures/avatar.gif")

        self.assertEqual(
            url, "https://api.example.test/media/profile_pictures/avatar.gif"
        )

    @override_settings(MEDIA_PUBLIC_BASE_URL="https://media.example.test/")
    def test_absolute_and_proxied_names_pass_through(self):
        storage = R2MediaStorage()

        self.assertEqual(
            storage.url("https://cdn.example/x.png"), "https://cdn.example/x.png"
        )
        self.assertEqual(
            storage.url("/media/resources/x.pdf"), "/media/resources/x.pdf"
        )
        self.assertEqual(storage.url(""), "")

    def test_objects_are_uploaded_with_immutable_cache_headers(self):
        # These headers are what lets the browser/CDN cache media for a year
        # once it is served directly from R2.
        self.assertEqual(
            R2MediaStorage.object_parameters.get("CacheControl"),
            "public, max-age=31536000, immutable",
        )


class R2DirectServingIntegrationTests(TestCase):
    def _require_public_media(self):
        if settings.STORAGES.get("default", {}).get("BACKEND") != R2_BACKEND:
            self.skipTest("R2 storage backend is not the default storage backend.")

        endpoint = settings.AWS_S3_ENDPOINT_URL or ""
        if not endpoint or "example.r2.cloudflarestorage.com" in endpoint:
            self.skipTest("R2 endpoint is not configured for integration tests.")

        if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
            self.skipTest("R2 credentials are not configured for integration tests.")

        if not getattr(settings, "MEDIA_PUBLIC_BASE_URL", ""):
            self.skipTest(
                "MEDIA_PUBLIC_BASE_URL (public media domain) is not configured."
            )

    def test_uploaded_object_is_publicly_servable(self):
        self._require_public_media()

        test_key = f"ci-r2-test/{uuid.uuid4().hex}.txt"
        content = b"lessonbase direct-serve integration test\n"

        stored_key = default_storage.save(test_key, ContentFile(content))
        self.addCleanup(lambda: self._safe_delete(stored_key))

        url = default_storage.url(stored_key)

        # The public URL must point at the CDN domain, not the Django proxy.
        self.assertTrue(
            url.startswith(settings.MEDIA_PUBLIC_BASE_URL.rstrip("/")), url
        )
        self.assertNotIn("/media/", url)

        with urlopen(url, timeout=30) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.read(), content)
            cache_control = response.headers.get("Cache-Control", "")

        # Confirm the long-lived cache headers survived the round trip to R2.
        self.assertIn("max-age=31536000", cache_control)

    @staticmethod
    def _safe_delete(key):
        try:
            default_storage.delete(key)
        except Exception:
            pass
