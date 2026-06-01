"""Tests for expiring, auto-rotating token authentication."""

from datetime import timedelta

from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.user_accounts.models import Teacher
from .authentication import (
    ExpiringTokenAuthentication,
    get_or_rotate_token,
    rotate_user_token,
    token_is_expired,
)


def make_teacher(email="teacher@example.com", username="auth_teacher"):
    return Teacher.objects.create_user(
        email=email,
        username=username,
        password="auth-password",
        hire_date="2024-01-01",
        is_confirmed=True,
        premium_account=True,
    )


class RotateUserTokenTests(TestCase):
    def test_rotation_issues_a_new_key_and_invalidates_the_old_one(self):
        user = make_teacher()
        first = Token.objects.create(user=user)
        old_key = first.key

        rotated = rotate_user_token(user)

        self.assertNotEqual(rotated.key, old_key)
        # The old token must no longer exist (single active token per user).
        self.assertFalse(Token.objects.filter(key=old_key).exists())
        self.assertEqual(Token.objects.filter(user=user).count(), 1)


@override_settings(
    AUTH_TOKEN_INACTIVITY_TTL=timedelta(days=14),
    AUTH_TOKEN_REFRESH_THRESHOLD=timedelta(minutes=5),
)
class ExpiringTokenAuthenticationTests(TestCase):
    def setUp(self):
        self.user = make_teacher()
        self.auth = ExpiringTokenAuthentication()

    def test_fresh_token_authenticates(self):
        token = Token.objects.create(user=self.user)
        authed_user, authed_token = self.auth.authenticate_credentials(token.key)
        # token.user is the base CustomAccount row; compare by pk rather than
        # identity since polymorphic subclasses (Teacher) aren't == the base.
        self.assertEqual(authed_user.pk, self.user.pk)
        self.assertEqual(authed_token.key, token.key)

    def test_expired_token_is_rejected_and_deleted(self):
        token = Token.objects.create(user=self.user)
        # Simulate a token last used well beyond the inactivity window.
        Token.objects.filter(pk=token.pk).update(
            created=timezone.now() - timedelta(days=15)
        )
        token.refresh_from_db()

        self.assertTrue(token_is_expired(token))
        with self.assertRaises(Exception):
            self.auth.authenticate_credentials(token.key)
        self.assertFalse(Token.objects.filter(key=token.key).exists())

    def test_sliding_refresh_bumps_last_seen_when_stale(self):
        token = Token.objects.create(user=self.user)
        stale = timezone.now() - timedelta(minutes=10)
        Token.objects.filter(pk=token.pk).update(created=stale)

        self.auth.authenticate_credentials(token.key)

        token.refresh_from_db()
        # "created" (last-seen) should have moved forward past the stale value.
        self.assertGreater(token.created, stale + timedelta(minutes=4))

    def test_sliding_refresh_throttled_for_recent_tokens(self):
        token = Token.objects.create(user=self.user)
        original = token.created

        self.auth.authenticate_credentials(token.key)

        token.refresh_from_db()
        # Recently used token is not rewritten (avoids a DB write per request).
        self.assertEqual(token.created, original)


@override_settings(
    AUTH_TOKEN_INACTIVITY_TTL=timedelta(days=14),
    AUTH_TOKEN_REFRESH_THRESHOLD=timedelta(minutes=5),
)
class GetOrRotateTokenTests(TestCase):
    def setUp(self):
        self.user = make_teacher()

    def test_creates_token_when_none_exists(self):
        token = get_or_rotate_token(self.user)
        self.assertTrue(Token.objects.filter(key=token.key, user=self.user).exists())

    def test_reuses_valid_token_so_concurrent_sessions_survive(self):
        first = get_or_rotate_token(self.user)
        second = get_or_rotate_token(self.user)
        # Same key reused: logging in again must not invalidate other sessions.
        self.assertEqual(first.key, second.key)

    def test_rotates_only_when_existing_token_is_expired(self):
        old = get_or_rotate_token(self.user)
        Token.objects.filter(pk=old.pk).update(
            created=timezone.now() - timedelta(days=15)
        )

        rotated = get_or_rotate_token(self.user)

        self.assertNotEqual(rotated.key, old.key)
        self.assertFalse(Token.objects.filter(key=old.key).exists())


class LoginRotationTests(TestCase):
    """The login endpoint reuses a valid token rather than rotating every time."""

    def setUp(self):
        self.client = APIClient()
        self.user = make_teacher()

    def test_login_reuses_token_across_logins(self):
        url = reverse("auth_login")
        creds = {"email": "teacher@example.com", "password": "auth-password"}

        first = self.client.post(url, creds, format="json")
        self.assertEqual(first.status_code, 200)
        first_token = first.data["token"]

        second = self.client.post(url, creds, format="json")
        self.assertEqual(second.status_code, 200)
        second_token = second.data["token"]

        # A second login returns the same still-valid token, so a login on one
        # device does not log the user out elsewhere.
        self.assertEqual(first_token, second_token)
        self.assertTrue(Token.objects.filter(key=first_token).exists())
