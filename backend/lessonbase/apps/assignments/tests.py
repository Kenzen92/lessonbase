import datetime

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.core.tests import BaseTestCase
from apps.assignments.models import Assignment, Submission, Feedback
from apps.resources.models import Resource


def make_pdf(name="test.pdf"):
    return SimpleUploadedFile(name, b"%PDF-1.4 test", content_type="application/pdf")


class AssignmentTestMixin:
    """Adds a helper to create a test Assignment with teacher + student enrolled."""

    def create_assignment(self):
        from apps.tags.utils import add_tag

        assignment = Assignment.objects.create(
            title="Test Assignment",
            max_score=100,
            due_date=datetime.date.today() + datetime.timedelta(days=7),
        )
        add_tag(assignment, self.subjects[0].name, kind="subject")
        assignment.teachers.add(self.teacher)
        assignment.students.add(self.student)
        return assignment


class SubmissionTest(AssignmentTestMixin, BaseTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.teacher_token, _ = Token.objects.get_or_create(user=self.teacher)
        self.student_token, _ = Token.objects.get_or_create(user=self.student)
        self.assignment = self.create_assignment()
        self.url = f"/assignment/{self.assignment.id}/submissions/"

    def _teacher_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.teacher_token.key}")

    def _student_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.student_token.key}")

    # ── create ───────────────────────────────────────────────────────────────

    def test_student_can_submit_text_answer(self):
        self._student_auth()
        response = self.client.post(
            self.url,
            {"answer_text": "My answer", "assignment": self.assignment.id},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        submission = Submission.objects.get(assignment=self.assignment, student=self.student)
        self.assertEqual(submission.student_id, self.student.id)  # NOT Student.objects.last()
        self.assertEqual(submission.answer_text, "My answer")
        self.assertEqual(submission.status, Submission.Status.SUBMITTED)

    def test_submission_student_is_authenticated_user_not_last(self):
        # Regression: old code used Student.objects.last() — this was a critical bug.
        from apps.user_accounts.models import Student

        # Create another student so .last() would differ from self.student
        other = Student.objects.create_user(
            email="other@example.com",
            password="pw",
            username="other_student",
        )
        self.assignment.students.add(other)

        self._student_auth()
        response = self.client.post(
            self.url,
            {"answer_text": "From correct student", "assignment": self.assignment.id},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        submission = Submission.objects.get(assignment=self.assignment, student=self.student)
        self.assertEqual(submission.student_id, self.student.id)
        self.assertNotEqual(submission.student_id, other.id)

    def test_second_submit_updates_not_duplicates(self):
        self._student_auth()
        self.client.post(
            self.url,
            {"answer_text": "First answer", "assignment": self.assignment.id},
            format="json",
        )
        response = self.client.post(
            self.url,
            {"answer_text": "Updated answer", "assignment": self.assignment.id},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        qs = Submission.objects.filter(assignment=self.assignment, student=self.student)
        self.assertEqual(qs.count(), 1)
        self.assertEqual(qs.get().answer_text, "Updated answer")

    def test_student_can_attach_file_to_submission(self):
        self._student_auth()
        response = self.client.post(
            self.url,
            {"answer_text": "With file", "assignment": self.assignment.id, "files": make_pdf()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.data)
        submission = Submission.objects.get(assignment=self.assignment, student=self.student)
        self.assertEqual(submission.files.count(), 1)
        resource = submission.files.first()
        self.assertEqual(resource.owner_id, self.student.id)
        self.assertEqual(resource.mime_type, "application/pdf")

    def test_teacher_cannot_submit(self):
        self._teacher_auth()
        response = self.client.post(
            self.url,
            {"answer_text": "Teacher trying to submit", "assignment": self.assignment.id},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_unassigned_student_cannot_submit(self):
        from apps.user_accounts.models import Student

        other = Student.objects.create_user(
            email="unassigned@example.com", password="pw", username="unassigned"
        )
        other_token = Token.objects.create(user=other)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {other_token.key}")
        response = self.client.post(
            self.url,
            {"answer_text": "Not assigned", "assignment": self.assignment.id},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    # ── list ─────────────────────────────────────────────────────────────────

    def test_teacher_sees_all_submissions(self):
        Submission.objects.create(
            assignment=self.assignment,
            student=self.student,
            answer_text="Student answer",
            status=Submission.Status.SUBMITTED,
        )
        self._teacher_auth()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_student_sees_only_own_submission(self):
        from apps.user_accounts.models import Student

        other = Student.objects.create_user(
            email="other2@example.com", password="pw", username="other2"
        )
        self.assignment.students.add(other)
        Submission.objects.create(
            assignment=self.assignment, student=self.student, answer_text="Mine"
        )
        Submission.objects.create(
            assignment=self.assignment, student=other, answer_text="Theirs"
        )
        self._student_auth()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["student"]["id"], self.student.id)


class FeedbackTest(AssignmentTestMixin, BaseTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.teacher_token, _ = Token.objects.get_or_create(user=self.teacher)
        self.student_token, _ = Token.objects.get_or_create(user=self.student)
        self.assignment = self.create_assignment()
        self.submission = Submission.objects.create(
            assignment=self.assignment,
            student=self.student,
            answer_text="Student answer",
            status=Submission.Status.SUBMITTED,
        )
        self.url = f"/submission/{self.submission.id}/feedback/"

    def _teacher_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.teacher_token.key}")

    def _student_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.student_token.key}")

    def test_teacher_can_create_feedback(self):
        self._teacher_auth()
        response = self.client.put(
            self.url,
            {"text": "Good work", "score": 85, "accepted": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        fb = Feedback.objects.get(submission=self.submission)
        self.assertEqual(fb.teacher_id, self.teacher.id)
        self.assertEqual(fb.text, "Good work")
        self.assertEqual(fb.score, 85)
        self.assertTrue(fb.accepted)

    def test_feedback_creation_marks_submission_as_graded(self):
        self._teacher_auth()
        self.client.put(
            self.url,
            {"text": "Graded", "score": 70, "accepted": False},
            format="json",
        )
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, Submission.Status.GRADED)

    def test_teacher_can_overwrite_feedback(self):
        self._teacher_auth()
        self.client.put(self.url, {"text": "First attempt", "score": 60}, format="json")
        response = self.client.put(self.url, {"text": "Revised", "score": 80}, format="json")
        self.assertEqual(response.status_code, 200)
        # OneToOne — only one feedback per submission
        qs = Feedback.objects.filter(submission=self.submission)
        self.assertEqual(qs.count(), 1)
        fb = qs.get()
        self.assertEqual(fb.text, "Revised")
        self.assertEqual(fb.score, 80)

    def test_teacher_can_attach_file_to_feedback(self):
        self._teacher_auth()
        response = self.client.put(
            self.url,
            {"text": "See attached", "score": 90, "files": make_pdf()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200, response.data)
        fb = Feedback.objects.get(submission=self.submission)
        self.assertEqual(fb.files.count(), 1)
        resource = fb.files.first()
        self.assertEqual(resource.owner_id, self.teacher.id)

    def test_student_cannot_create_feedback(self):
        self._student_auth()
        response = self.client.put(
            self.url, {"text": "Hacking", "score": 100}, format="json"
        )
        self.assertEqual(response.status_code, 403)

    def test_student_can_read_own_feedback(self):
        Feedback.objects.create(
            submission=self.submission,
            teacher=self.teacher,
            text="Good",
            score=75,
            accepted=True,
        )
        self._student_auth()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["score"], 75)

    def test_feedback_get_returns_404_if_no_feedback_yet(self):
        self._teacher_auth()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 404)


class AssignmentMaterialTest(AssignmentTestMixin, BaseTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.teacher_token, _ = Token.objects.get_or_create(user=self.teacher)
        self.student_token, _ = Token.objects.get_or_create(user=self.student)
        self.assignment = self.create_assignment()
        self.url = f"/assignment/{self.assignment.id}/materials/"

    def _teacher_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.teacher_token.key}")

    def _student_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.student_token.key}")

    def test_teacher_can_attach_material(self):
        self._teacher_auth()
        response = self.client.post(
            self.url, {"file": make_pdf()}, format="multipart"
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.assignment.material_links.count(), 1)

    def test_student_cannot_attach_material(self):
        self._student_auth()
        response = self.client.post(
            self.url, {"file": make_pdf()}, format="multipart"
        )
        self.assertEqual(response.status_code, 403)

    def test_teacher_can_detach_material(self):
        self._teacher_auth()
        resource = Resource.objects.create(
            owner=self.teacher,
            title="Worksheet",
            kind=Resource.Kind.LINK,
            url="https://x.com",
        )
        from apps.resources.models import AssignmentMaterial
        AssignmentMaterial.objects.create(assignment=self.assignment, resource=resource)

        response = self.client.delete(f"{self.url}{resource.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(self.assignment.material_links.count(), 0)
        self.assertEqual(Resource.objects.count(), 1)  # Resource not deleted


class AssignmentCreateEditApiTest(AssignmentTestMixin, BaseTestCase):
    """Covers creating with only a title and editing via the wizard's PATCH path."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.teacher_token, _ = Token.objects.get_or_create(user=self.teacher)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.teacher_token.key}")

    def test_create_with_only_a_title(self):
        response = self.client.post(
            "/assignment/",
            {
                "title": "Minimal",
                "max_score": 100,
                "due_date": "2099-01-01",
                "students": [],
                "tags": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(Assignment.objects.filter(title="Minimal").exists())

    def test_edit_assignment_updates_title_and_tags(self):
        assignment = self.create_assignment()
        response = self.client.patch(
            f"/assignment/{assignment.id}/",
            {"title": "Renamed", "tags": [{"name": "Revision"}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        assignment.refresh_from_db()
        self.assertEqual(assignment.title, "Renamed")

        from apps.tags.utils import tags_for

        names = set(tags_for(assignment).values_list("name", flat=True))
        self.assertIn("Revision", names)
