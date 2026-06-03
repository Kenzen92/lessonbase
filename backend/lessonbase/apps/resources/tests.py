import io

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.core.tests import BaseTestCase
from apps.resources.models import (
    Resource,
    ResourceTag,
    ClassResource,
    AssignmentMaterial,
)


def make_pdf(name="test.pdf"):
    return SimpleUploadedFile(name, b"%PDF-1.4 test content", content_type="application/pdf")


def make_invalid_file(name="virus.exe"):
    return SimpleUploadedFile(name, b"MZ malicious", content_type="application/octet-stream")


class ResourceLibraryTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.teacher_token, _ = Token.objects.get_or_create(user=self.teacher)
        self.student_token, _ = Token.objects.get_or_create(user=self.student)
        self.url = "/resources/"

    def _teacher_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.teacher_token.key}")

    def _student_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.student_token.key}")

    # ── create ───────────────────────────────────────────────────────────────

    def test_teacher_can_upload_file_resource(self):
        self._teacher_auth()
        response = self.client.post(
            self.url,
            {"kind": "file", "file": make_pdf()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.data)
        resource_id = response.data["id"]
        resource = Resource.objects.get(pk=resource_id)
        self.assertEqual(resource.owner_id, self.teacher.id)
        self.assertEqual(resource.kind, Resource.Kind.FILE)
        self.assertEqual(resource.original_name, "test.pdf")
        self.assertEqual(resource.mime_type, "application/pdf")

    def test_teacher_can_create_link_resource(self):
        self._teacher_auth()
        response = self.client.post(
            self.url,
            {"kind": "link", "url": "https://example.com/doc", "title": "My Link"},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        resource = Resource.objects.get()
        self.assertEqual(resource.kind, Resource.Kind.LINK)
        self.assertEqual(resource.url, "https://example.com/doc")

    def test_link_without_url_is_rejected(self):
        self._teacher_auth()
        response = self.client.post(
            self.url, {"kind": "link", "title": "Bad link"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_file_without_file_is_rejected(self):
        self._teacher_auth()
        response = self.client.post(
            self.url, {"kind": "file", "title": "No file"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_disallowed_mime_type_is_rejected(self):
        self._teacher_auth()
        response = self.client.post(
            self.url,
            {"kind": "file", "file": make_invalid_file()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)

    # ── list ─────────────────────────────────────────────────────────────────

    def test_list_returns_only_own_resources(self):
        self._teacher_auth()
        Resource.objects.create(
            owner=self.teacher,
            title="Mine",
            kind=Resource.Kind.LINK,
            url="https://a.com",
        )
        Resource.objects.create(
            owner=self.student,
            title="Not mine",
            kind=Resource.Kind.LINK,
            url="https://b.com",
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Mine")

    # ── soft delete + restore ────────────────────────────────────────────────

    def test_soft_delete_excludes_resource_from_list(self):
        self._teacher_auth()
        resource = Resource.objects.create(
            owner=self.teacher,
            title="Will be deleted",
            kind=Resource.Kind.LINK,
            url="https://c.com",
        )
        response = self.client.delete(f"{self.url}{resource.id}/")
        self.assertEqual(response.status_code, 204)
        # Row still exists in DB
        self.assertEqual(Resource.all_objects.count(), 1)
        # But default manager hides it
        self.assertEqual(Resource.objects.count(), 0)
        # And list endpoint hides it
        list_response = self.client.get(self.url)
        self.assertEqual(len(list_response.data), 0)

    def test_restore_makes_resource_visible_again(self):
        self._teacher_auth()
        resource = Resource.objects.create(
            owner=self.teacher,
            title="Restore me",
            kind=Resource.Kind.LINK,
            url="https://d.com",
        )
        resource.soft_delete()
        response = self.client.post(f"{self.url}{resource.id}/restore/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Resource.objects.count(), 1)

    def test_owner_only_can_delete(self):
        self._student_auth()
        resource = Resource.objects.create(
            owner=self.teacher,
            title="Teacher's",
            kind=Resource.Kind.LINK,
            url="https://e.com",
        )
        response = self.client.delete(f"{self.url}{resource.id}/")
        self.assertEqual(response.status_code, 403)

    # ── update ───────────────────────────────────────────────────────────────

    def test_owner_can_update_title(self):
        self._teacher_auth()
        resource = Resource.objects.create(
            owner=self.teacher,
            title="Old title",
            kind=Resource.Kind.LINK,
            url="https://f.com",
        )
        response = self.client.patch(
            f"{self.url}{resource.id}/", {"title": "New title"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        resource.refresh_from_db()
        self.assertEqual(resource.title, "New title")


class ResourceTagTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.teacher_token, _ = Token.objects.get_or_create(user=self.teacher)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.teacher_token.key}")
        self.url = "/resource-tags/"

    def test_create_tag(self):
        response = self.client.post(self.url, {"name": "Math"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ResourceTag.objects.count(), 1)

    def test_duplicate_tag_is_idempotent(self):
        self.client.post(self.url, {"name": "Physics"}, format="json")
        response = self.client.post(self.url, {"name": "Physics"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ResourceTag.objects.count(), 1)

    def test_delete_own_tag(self):
        tag = ResourceTag.objects.create(owner=self.teacher, name="ToDelete")
        response = self.client.delete(f"{self.url}{tag.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(ResourceTag.objects.count(), 0)


class ClassEventResourcesTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.teacher_token, _ = Token.objects.get_or_create(user=self.teacher)
        self.student_token, _ = Token.objects.get_or_create(user=self.student)
        self.lesson = self.lessons[0]
        self.url = f"/class-event/{self.lesson.id}/resources/"

    def _teacher_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.teacher_token.key}")

    def _student_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.student_token.key}")

    def test_teacher_can_attach_file(self):
        self._teacher_auth()
        response = self.client.post(
            self.url, {"file": make_pdf()}, format="multipart"
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(ClassResource.objects.count(), 1)
        link = ClassResource.objects.get()
        self.assertEqual(link.class_event, self.lesson)
        self.assertIsNotNone(link.resource)

    def test_teacher_can_attach_existing_resource(self):
        self._teacher_auth()
        resource = Resource.objects.create(
            owner=self.teacher,
            title="Existing PDF",
            kind=Resource.Kind.LINK,
            url="https://g.com",
        )
        response = self.client.post(
            self.url, {"resource_id": resource.id}, format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ClassResource.objects.count(), 1)

    def test_attaching_same_resource_twice_is_idempotent(self):
        self._teacher_auth()
        resource = Resource.objects.create(
            owner=self.teacher,
            title="Once",
            kind=Resource.Kind.LINK,
            url="https://h.com",
        )
        self.client.post(self.url, {"resource_id": resource.id}, format="json")
        self.client.post(self.url, {"resource_id": resource.id}, format="json")
        self.assertEqual(ClassResource.objects.count(), 1)

    def test_student_cannot_attach_resources(self):
        self._student_auth()
        response = self.client.post(
            self.url, {"file": make_pdf()}, format="multipart"
        )
        self.assertEqual(response.status_code, 403)

    def test_teacher_can_detach_resource(self):
        self._teacher_auth()
        resource = Resource.objects.create(
            owner=self.teacher,
            title="Detach me",
            kind=Resource.Kind.LINK,
            url="https://i.com",
        )
        ClassResource.objects.create(
            class_event=self.lesson, resource=resource, added_by=self.teacher
        )
        response = self.client.delete(f"{self.url}{resource.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(ClassResource.objects.count(), 0)
        # Resource itself still exists
        self.assertEqual(Resource.objects.count(), 1)

    def test_detach_does_not_delete_underlying_resource(self):
        self._teacher_auth()
        resource = Resource.objects.create(
            owner=self.teacher,
            title="Keep me",
            kind=Resource.Kind.LINK,
            url="https://j.com",
        )
        ClassResource.objects.create(
            class_event=self.lesson, resource=resource, added_by=self.teacher
        )
        self.client.delete(f"{self.url}{resource.id}/")
        self.assertEqual(Resource.objects.filter(id=resource.id).count(), 1)

    def test_list_class_resources(self):
        resource = Resource.objects.create(
            owner=self.teacher,
            title="Listed",
            kind=Resource.Kind.LINK,
            url="https://k.com",
        )
        ClassResource.objects.create(
            class_event=self.lesson, resource=resource, added_by=self.teacher
        )
        self._teacher_auth()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Listed")
