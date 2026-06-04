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
