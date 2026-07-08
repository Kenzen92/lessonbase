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


class TeacherDirectoryApiTest(BaseTestCase):
    """GET /teacher/ is role-scoped: a teacher sees themselves, a student
    sees the teachers they belong to — and can never write."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def _login(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_student_lists_their_teachers(self):
        self._login(self.student)
        res = self.client.get("/teacher/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual([t["id"] for t in res.data], [self.teacher.id])
        entry = res.data[0]
        # Directory payload: contact details + subjects, never the roster.
        self.assertIn("email", entry)
        self.assertIn("profile_picture", entry)
        self.assertEqual(len(entry["subjects"]), 3)
        self.assertNotIn("students", entry)

    def test_student_without_teachers_gets_empty_list(self):
        outsider = self.create_extra_student()
        self._login(outsider)
        res = self.client.get("/teacher/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.data, [])

    def test_student_cannot_update_a_teacher(self):
        self._login(self.student)
        res = self.client.patch(
            f"/teacher/{self.teacher.id}/", {"first_name": "Hacked"}, format="json"
        )
        self.assertEqual(res.status_code, 403, res.content)

    def test_teacher_lists_only_themselves(self):
        from apps.user_accounts.models import Teacher

        Teacher.objects.create_user(
            email="other@example.com",
            password="password123",
            username="other_teacher",
            hire_date="2024-01-01",
        )
        self._login(self.teacher)
        res = self.client.get("/teacher/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual([t["id"] for t in res.data], [self.teacher.id])


class ClassGroupRoleApiTest(BaseTestCase):
    """Students see the class groups they belong to, read-only; teachers
    keep full management access."""

    def setUp(self):
        super().setUp()
        from apps.user_accounts.models import ClassGroup

        self.client = APIClient()
        self.group = ClassGroup.objects.create(name="Set A")
        self.group.teachers.add(self.teacher)
        self.group.students.add(self.student)
        self.other_group = ClassGroup.objects.create(name="Set B")
        self.other_group.teachers.add(self.teacher)

    def _login(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_student_lists_only_their_groups(self):
        self._login(self.student)
        res = self.client.get("/class-group/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual([g["id"] for g in res.data], [self.group.id])
        # The student-facing payload names the group's teachers.
        self.assertEqual(
            [t["id"] for t in res.data[0]["teachers"]], [self.teacher.id]
        )

    def test_student_can_retrieve_their_group(self):
        self._login(self.student)
        res = self.client.get(f"/class-group/{self.group.id}/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.data["name"], "Set A")
        self.assertEqual([t["id"] for t in res.data["teachers"]], [self.teacher.id])

    def test_student_cannot_retrieve_other_groups(self):
        self._login(self.student)
        res = self.client.get(f"/class-group/{self.other_group.id}/")
        self.assertEqual(res.status_code, 404, res.content)

    def test_student_cannot_write_class_groups(self):
        self._login(self.student)
        create = self.client.post("/class-group/", {"name": "Rogue"}, format="json")
        self.assertEqual(create.status_code, 403, create.content)
        edit = self.client.patch(
            f"/class-group/{self.group.id}/", {"name": "Renamed"}, format="json"
        )
        self.assertEqual(edit.status_code, 403, edit.content)
        delete = self.client.delete(f"/class-group/{self.group.id}/")
        self.assertEqual(delete.status_code, 403, delete.content)

    def test_teacher_still_lists_their_groups(self):
        self._login(self.teacher)
        res = self.client.get("/class-group/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(
            {g["id"] for g in res.data}, {self.group.id, self.other_group.id}
        )


class StudentInvitePermissionTest(BaseTestCase):
    """POST /new-student/ is a teacher-only invite."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def _login(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_student_cannot_invite(self):
        self._login(self.student)
        res = self.client.post(
            "/new-student/", {"email": "friend@example.com"}, format="json"
        )
        self.assertEqual(res.status_code, 403, res.content)

    def test_teacher_can_invite(self):
        from apps.user_accounts.models import Student

        self._login(self.teacher)
        res = self.client.post(
            "/new-student/", {"email": "invitee@example.com"}, format="json"
        )
        self.assertEqual(res.status_code, 200, res.content)
        invitee = Student.objects.get(email="invitee@example.com")
        self.assertIn(invitee, self.teacher.students.all())


class StudentEmailExposureTest(BaseTestCase):
    """Email addresses reach only entitled readers: the student's own
    profile and the teacher's directory — never classmates via rosters."""

    def setUp(self):
        super().setUp()
        from apps.user_accounts.models import ClassGroup

        self.client = APIClient()
        self.group = ClassGroup.objects.create(name="Set A")
        self.group.teachers.add(self.teacher)
        self.group.students.add(self.student)

    def _login(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_student_profile_includes_own_email(self):
        self._login(self.student)
        res = self.client.get("/profile/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.data["email"], "student@example.com")

    def test_teacher_student_directory_includes_emails(self):
        self._login(self.teacher)
        res = self.client.get("/student/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.data[0]["email"], "student@example.com")

    def test_class_group_roster_omits_classmate_emails(self):
        classmate = self.create_extra_student()
        self.group.students.add(classmate)

        self._login(self.student)
        res = self.client.get(f"/class-group/{self.group.id}/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(len(res.data["students"]), 2)
        for entry in res.data["students"]:
            self.assertNotIn("email", entry)
            self.assertIn("first_name", entry)
            self.assertIn("profile_picture", entry)
