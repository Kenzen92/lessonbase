from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.core.tests import UserFixtureMixin
from apps.tags.models import Tag
from apps.tags.utils import set_tags, add_tag, tags_for


class TagUtilsTest(UserFixtureMixin, TestCase):
    def setUp(self):
        self.teacher = self.create_teacher()

    def test_add_tag_is_idempotent(self):
        # Note: a post_migrate seed populates other tags/objects, so scope
        # assertions to this fixture's object rather than global counts.
        add_tag(self.teacher, "RevisionXYZ", color="#fff", kind="general")
        add_tag(self.teacher, "RevisionXYZ", color="#fff", kind="general")
        self.assertEqual(tags_for(self.teacher).count(), 1)

    def test_set_tags_replaces_the_tag_set(self):
        set_tags(self.teacher, [{"name": "Year 9"}, {"name": "Macbeth"}])
        self.assertEqual(tags_for(self.teacher).count(), 2)

        # Replacing drops the ones no longer present and keeps the rest.
        set_tags(self.teacher, [{"name": "Macbeth"}, "Essay"])
        names = set(tags_for(self.teacher).values_list("name", flat=True))
        self.assertEqual(names, {"Macbeth", "Essay"})

    def test_set_tags_accepts_strings_and_ids(self):
        existing, _ = Tag.objects.get_or_create(
            name="PhysicsXYZ", kind="subject", defaults={"color": "#004d40"}
        )
        set_tags(self.teacher, ["HomeworkXYZ", existing.id])
        names = set(tags_for(self.teacher).values_list("name", flat=True))
        self.assertEqual(names, {"HomeworkXYZ", "PhysicsXYZ"})


class TagEndpointTest(UserFixtureMixin, TestCase):
    def setUp(self):
        self.teacher = self.create_teacher()
        self.client = APIClient()
        token, _ = Token.objects.get_or_create(user=self.teacher)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_requires_authentication(self):
        anon = APIClient()
        self.assertEqual(anon.get("/tags/").status_code, 401)

    def test_create_and_autocomplete(self):
        created = self.client.post(
            "/tags/", {"name": "Revision", "color": "#2196F3"}, format="json"
        )
        self.assertEqual(created.status_code, 201, created.content)

        listed = self.client.get("/tags/?q=rev")
        self.assertEqual(listed.status_code, 200)
        names = [t["name"] for t in listed.json()]
        self.assertIn("Revision", names)
