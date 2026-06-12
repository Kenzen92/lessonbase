from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.core.tests import BaseTestCase
from apps.tags.utils import tags_for


class SetUpTestCase(BaseTestCase):

    def setUp(self):
        super().setUp()

    def test_setup_runs(self):
        self.assertIsNotNone(self.teacher)

    def test_teacher_has_students(self):
        self.assertIn(self.student, self.teacher.students.all())

    def test_teacher_cannot_add_self_as_student(self):
        with self.assertRaises(TypeError):
            self.teacher.students.add(self.teacher)


class MarketingPreferencesApiTest(BaseTestCase):
    """GET lazily creates an opted-out row; PATCH toggles persist. The
    endpoint serves whichever account is authenticated (teacher or student)."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        token, _ = Token.objects.get_or_create(user=self.teacher)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_get_defaults_to_all_opted_out(self):
        res = self.client.get("/marketing-preferences/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(
            res.data,
            {
                "product_updates": False,
                "tips_and_tutorials": False,
                "promotions": False,
            },
        )

    def test_patch_toggles_persist(self):
        res = self.client.patch(
            "/marketing-preferences/",
            {"product_updates": True, "promotions": True},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertTrue(res.data["product_updates"])
        self.assertFalse(res.data["tips_and_tutorials"])
        self.assertTrue(res.data["promotions"])

        # Survives a re-read and stays scoped to this account.
        res = self.client.get("/marketing-preferences/")
        self.assertTrue(res.data["product_updates"])

        from apps.user_accounts.models import MarketingPreferences

        self.assertEqual(MarketingPreferences.objects.count(), 1)
        self.assertEqual(
            MarketingPreferences.objects.get().account_id, self.teacher.id
        )

    def test_student_has_independent_preferences(self):
        student_client = APIClient()
        token, _ = Token.objects.get_or_create(user=self.student)
        student_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        self.client.patch(
            "/marketing-preferences/", {"product_updates": True}, format="json"
        )
        res = student_client.get("/marketing-preferences/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertFalse(res.data["product_updates"])

    def test_requires_authentication(self):
        res = APIClient().get("/marketing-preferences/")
        self.assertEqual(res.status_code, 401)


class ClassGroupApiTest(BaseTestCase):
    """Covers create + edit of a class group, including the tags write path.

    Regression: editing a group used to 500 with 'GenericRelatedObjectManager
    object is not iterable' because the writable tags field tried to serialize
    the GenericRelation on the update response.
    """

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        token, _ = Token.objects.get_or_create(user=self.teacher)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_create_class_group_with_only_a_name(self):
        res = self.client.post("/class-group/", {"name": "Set A"}, format="json")
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.data["name"], "Set A")

    def test_create_and_edit_class_group_with_tags(self):
        create = self.client.post(
            "/class-group/",
            {"name": "Set B", "tags": [{"name": "Year 9"}]},
            format="json",
        )
        self.assertEqual(create.status_code, 201, create.content)
        group_id = create.data["id"]

        # The wizard sends the full payload on edit, so mirror that here.
        edit = self.client.patch(
            f"/class-group/{group_id}/",
            {
                "name": "Set B",
                "description": "Edited",
                "tags": [{"name": "Year 9"}, "Revision"],
            },
            format="json",
        )
        # The bug surfaced here as a 500.
        self.assertEqual(edit.status_code, 200, edit.content)
        self.assertEqual(edit.data["description"], "Edited")

        from apps.user_accounts.models import ClassGroup

        group = ClassGroup.objects.get(id=group_id)
        names = set(tags_for(group).values_list("name", flat=True))
        self.assertEqual(names, {"Year 9", "Revision"})
