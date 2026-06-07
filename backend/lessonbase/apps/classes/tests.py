from datetime import timedelta

from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.core.tests import BaseTestCase
from apps.classes.models import ClassEvent, SessionFeedback


class SessionFeedbackAPITest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.student_token, _ = Token.objects.get_or_create(user=self.student)
        self.teacher_token, _ = Token.objects.get_or_create(user=self.teacher)
        self.lesson = self.lessons[0]
        self.url = "/session-feedback/"

    def _student_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.student_token.key}")

    def _teacher_auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.teacher_token.key}")

    # ── submit ──────────────────────────────────────────────────────────────

    def test_student_can_submit_feedback(self):
        self._student_auth()
        response = self.client.post(self.url, {
            "class_event": self.lesson.id,
            "rating": 4,
            "comment": "Great class!",
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["rating"], 4)
        self.assertEqual(SessionFeedback.objects.count(), 1)

    def test_feedback_comment_is_optional(self):
        self._student_auth()
        response = self.client.post(self.url, {
            "class_event": self.lesson.id,
            "rating": 5,
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["comment"], "")

    def test_student_cannot_submit_feedback_twice(self):
        self._student_auth()
        self.client.post(self.url, {"class_event": self.lesson.id, "rating": 4})
        response = self.client.post(self.url, {"class_event": self.lesson.id, "rating": 3})
        self.assertEqual(response.status_code, 400)
        self.assertIn("already submitted", response.data["error"])
        self.assertEqual(SessionFeedback.objects.count(), 1)

    def test_teacher_cannot_submit_feedback(self):
        self._teacher_auth()
        response = self.client.post(self.url, {
            "class_event": self.lesson.id,
            "rating": 5,
        })
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_request_rejected(self):
        response = self.client.post(self.url, {
            "class_event": self.lesson.id,
            "rating": 4,
        })
        self.assertEqual(response.status_code, 401)

    def test_rating_out_of_range_rejected(self):
        self._student_auth()
        for bad in (0, 6, -1):
            response = self.client.post(self.url, {
                "class_event": self.lesson.id,
                "rating": bad,
            })
            self.assertEqual(response.status_code, 400, msg=f"rating={bad} should be rejected")

    def test_missing_rating_rejected(self):
        self._student_auth()
        response = self.client.post(self.url, {"class_event": self.lesson.id})
        self.assertEqual(response.status_code, 400)

    def test_student_not_enrolled_cannot_submit(self):
        outsider = self.create_extra_student()
        outsider_token, _ = Token.objects.get_or_create(user=outsider)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {outsider_token.key}")
        response = self.client.post(self.url, {
            "class_event": self.lesson.id,
            "rating": 3,
        })
        self.assertEqual(response.status_code, 403)

    def test_nonexistent_class_event_returns_404(self):
        self._student_auth()
        response = self.client.post(self.url, {"class_event": 99999, "rating": 4})
        self.assertEqual(response.status_code, 404)

    # ── aggregate ───────────────────────────────────────────────────────────

    def _aggregate_url(self, pk):
        return f"{self.url}{pk}/aggregate/"

    def _seed_feedback(self):
        SessionFeedback.objects.create(
            class_event=self.lesson, student=self.student, rating=4, comment="Good"
        )

    def test_teacher_can_view_aggregate(self):
        self._seed_feedback()
        self._teacher_auth()
        response = self.client.get(self._aggregate_url(self.lesson.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_responses"], 1)
        self.assertAlmostEqual(float(response.data["average_rating"]), 4.0)
        self.assertEqual(len(response.data["comments"]), 1)

    def test_aggregate_empty_when_no_feedback(self):
        self._teacher_auth()
        response = self.client.get(self._aggregate_url(self.lesson.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_responses"], 0)
        self.assertIsNone(response.data["average_rating"])

    def test_aggregate_rating_distribution(self):
        extra_student = self.create_extra_student()
        self.lesson.students.add(extra_student)
        SessionFeedback.objects.create(
            class_event=self.lesson, student=self.student, rating=5
        )
        SessionFeedback.objects.create(
            class_event=self.lesson, student=extra_student, rating=3
        )
        self._teacher_auth()
        response = self.client.get(self._aggregate_url(self.lesson.id))
        self.assertEqual(response.status_code, 200)
        dist = response.data["rating_distribution"]
        self.assertEqual(dist["5"], 1)
        self.assertEqual(dist["3"], 1)
        self.assertEqual(dist["1"], 0)

    def test_student_cannot_view_aggregate(self):
        self._seed_feedback()
        self._student_auth()
        response = self.client.get(self._aggregate_url(self.lesson.id))
        self.assertEqual(response.status_code, 403)

    def test_teacher_cannot_view_other_teachers_class(self):
        from apps.user_accounts.models import Teacher
        other = Teacher.objects.create_user(
            email="other@example.com",
            password="password123",
            is_confirmed=True,
            username="other_teacher",
            hire_date="2024-01-01",
        )
        other_token, _ = Token.objects.get_or_create(user=other)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {other_token.key}")
        self._seed_feedback()
        response = self.client.get(self._aggregate_url(self.lesson.id))
        self.assertEqual(response.status_code, 403)


class ClassEventListAPITest(BaseTestCase):
    """The dashboard list endpoint: legacy flat array without params, and a
    range-scoped, server-paginated window when `?range=` is supplied."""

    URL = "/class-event/"

    def setUp(self):
        super().setUp()
        # BaseTestCase seeds 3 past lessons (dated 2024). Add future events so we
        # can exercise both ranges.
        self.client = APIClient()
        self.teacher_token, _ = Token.objects.get_or_create(user=self.teacher)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.teacher_token.key}")

    def _make_events(self, count, *, future, base_offset_days=1):
        now = timezone.now()
        created = []
        for i in range(count):
            delta = timedelta(days=base_offset_days + i)
            start = now + delta if future else now - delta
            event = ClassEvent.objects.create(start_time=start, duration=60)
            event.teachers.add(self.teacher)
            created.append(event)
        return created

    def test_list_without_range_returns_flat_array(self):
        # Legacy contract the original dashboard relies on: a bare list, not a
        # pagination envelope.
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 3)  # the three seeded past lessons

    def test_upcoming_returns_paginated_future_only_ascending(self):
        self._make_events(4, future=True)
        response = self.client.get(self.URL, {"range": "upcoming"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["count"], 4)  # past lessons excluded
        starts = [row["start_time"] for row in response.data["results"]]
        self.assertEqual(starts, sorted(starts))  # ascending

    def test_previous_returns_past_only_descending(self):
        self._make_events(2, future=True)
        response = self.client.get(self.URL, {"range": "previous"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 3)  # only the seeded past lessons
        starts = [row["start_time"] for row in response.data["results"]]
        self.assertEqual(starts, sorted(starts, reverse=True))  # most-recent first

    def test_upcoming_caps_page_at_15_and_paginates(self):
        self._make_events(20, future=True)
        first = self.client.get(self.URL, {"range": "upcoming"})
        self.assertEqual(len(first.data["results"]), 15)
        self.assertEqual(first.data["count"], 20)
        self.assertIsNotNone(first.data["next"])

        second = self.client.get(self.URL, {"range": "upcoming", "offset": 15})
        self.assertEqual(len(second.data["results"]), 5)
        self.assertIsNone(second.data["next"])
