import uuid
from tempfile import TemporaryDirectory

import uuid
from tempfile import TemporaryDirectory

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.classes.models import ClassEvent, TeachingResource
from apps.subjects.models import Subject
from apps.user_accounts.models import Teacher

TEST_STORAGE_SETTINGS = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

ONE_BY_ONE_GIF = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff"
    b"!\xf9\x04\x01\n\x00\x01\x00,\x00\x00\x00\x00\x01\x00\x01"
    b"\x00\x00\x02\x02D\x01\x00;"
)


@override_settings(
    STORAGES=TEST_STORAGE_SETTINGS,
    MEDIA_URL="/media/",
    BASE_URL="http://testserver",
)
class StorageTests(TestCase):
    def setUp(self):
        super().setUp()
        self.temp_media_dir = TemporaryDirectory()
        self.addCleanup(self.temp_media_dir.cleanup)

        media_settings = override_settings(MEDIA_ROOT=self.temp_media_dir.name)
        media_settings.enable()
        self.addCleanup(media_settings.disable)

        self.client = APIClient()
        self.teacher = Teacher.objects.create_user(
            email="teacher@example.com",
            username="storage_teacher",
            password="storage-password",
            hire_date="2024-01-01",
            is_confirmed=True,
            premium_account=True,
        )
        token = Token.objects.create(user=self.teacher)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        self.subject = Subject.objects.create(
            name="Storage Test Subject",
            code="STS1",
            color="#123456",
        )
        self.teacher.subjects.add(self.subject)
        self.class_event = ClassEvent.objects.create(
            start_time=timezone.now(),
            duration=60,
            subject=self.subject,
        )
        self.class_event.teachers.add(self.teacher)

    def test_profile_picture_upload_and_readback(self):
        response = self.client.patch(
            "/profile/",
            {"profile_picture": self._image_upload("avatar.gif")},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)

        self.teacher.refresh_from_db()
        self.assertTrue(
            self.teacher.profile_picture.name.startswith("profile_pictures/")
        )
        self.assertEqual(
            response.data["profile_picture"],
            f"/media/{self.teacher.profile_picture.name}",
        )

        media_response = self.client.get(f"/media/{self.teacher.profile_picture.name}")

        self.assertEqual(media_response.status_code, 200)
        self.assertEqual(media_response["Content-Type"], "image/gif")
        self.assertEqual(b"".join(media_response.streaming_content), ONE_BY_ONE_GIF)

    def test_teaching_resource_upload_and_readback(self):
        file_content = b"lessonbase storage test resource\n"
        response = self.client.post(
            "/class_material",
            {
                "class_id": str(self.class_event.id),
                "file": self._text_upload("lesson-plan.txt", file_content),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)

        resource = TeachingResource.objects.get(class_event=self.class_event)
        self.assertEqual(resource.name, "lesson-plan.txt")
        self.assertTrue(resource.file.name.startswith("resources/"))

        media_response = self.client.get(f"/media/{resource.file.name}")

        self.assertEqual(media_response.status_code, 200)
        self.assertEqual(media_response["Content-Type"], "text/plain")
        self.assertEqual(b"".join(media_response.streaming_content), file_content)

    @staticmethod
    def _image_upload(name):
        from django.core.files.uploadedfile import SimpleUploadedFile

        return SimpleUploadedFile(name, ONE_BY_ONE_GIF, content_type="image/gif")

    @staticmethod
    def _text_upload(name, content):
        from django.core.files.uploadedfile import SimpleUploadedFile

        return SimpleUploadedFile(name, content, content_type="text/plain")


class R2StorageIntegrationTests(TestCase):
    def _ensure_r2_settings(self):
        if settings.STORAGES.get("default", {}).get("BACKEND") != "apps.storage.storage_backends.R2MediaStorage":
            self.skipTest("R2 storage backend is not configured as the default storage backend.")

        if not settings.AWS_S3_ENDPOINT_URL or "example.r2.cloudflarestorage.com" in settings.AWS_S3_ENDPOINT_URL:
            self.skipTest("R2 endpoint is not configured for integration tests.")

        if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
            self.skipTest("R2 credentials are not configured for integration tests.")

    def test_r2_storage_upload_and_readback(self):
        self._ensure_r2_settings()

        test_key = f"ci-r2-test/{uuid.uuid4().hex}.txt"
        content = b"lessonbase R2 integration test\n"

        stored_key = default_storage.save(test_key, ContentFile(content))

        def cleanup():
            try:
                default_storage.delete(stored_key)
            except Exception:
                pass

        self.addCleanup(cleanup)

        self.assertEqual(stored_key, test_key)
        self.assertTrue(default_storage.exists(stored_key))

        with default_storage.open(stored_key, "rb") as saved_file:
            self.assertEqual(saved_file.read(), content)

        object_url = default_storage.url(stored_key)
        self.assertIn("/media/", object_url)
        self.assertTrue(object_url.endswith(stored_key))
