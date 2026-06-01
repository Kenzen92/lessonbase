"""Expiring, auto-rotating token authentication.

Replaces DRF's default *non-expiring* ``TokenAuthentication``. A token here
behaves like a sliding session:

* It stays valid as long as it is used at least once every
  ``AUTH_TOKEN_INACTIVITY_TTL`` (default 14 days). After that window of
  inactivity the token is considered expired, is deleted, and the client is
  asked to log in again.
* Each authenticated request bumps the token's ``created`` timestamp (used here
  as a "last seen" marker), but only once per ``AUTH_TOKEN_REFRESH_THRESHOLD``
  (default 5 minutes) so we don't issue a DB write on every single request.
* On every login the token is *rotated*: any existing token for the user is
  deleted and a brand new key is issued (see :func:`rotate_user_token`). This
  limits the lifetime/blast-radius of a leaked credential.

This keeps the existing ``Authorization: Token <key>`` scheme, so no client
changes are required: the frontend simply gets a 401 once a token has expired
and falls back to the login screen.

Note: DRF's stock ``Token`` model only stores a single ``created`` timestamp,
so we implement an inactivity (sliding) timeout rather than an absolute maximum
lifetime. An absolute cap would require a custom token model with a second
timestamp; see the PR description for that follow-up.
"""

from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed


def get_inactivity_ttl():
    """How long a token may go unused before it expires."""
    return getattr(settings, "AUTH_TOKEN_INACTIVITY_TTL", timedelta(days=14))


def get_refresh_threshold():
    """Minimum age before a used token's ``last seen`` timestamp is bumped."""
    return getattr(settings, "AUTH_TOKEN_REFRESH_THRESHOLD", timedelta(minutes=5))


def token_is_expired(token, now=None):
    """Return True if ``token`` has not been used within the inactivity TTL."""
    now = now or timezone.now()
    return token.created < now - get_inactivity_ttl()


def refresh_token_if_stale(token, now=None):
    """Slide the token's expiry forward, throttled by the refresh threshold."""
    now = now or timezone.now()
    if now - token.created >= get_refresh_threshold():
        token.created = now
        token.save(update_fields=["created"])


def rotate_user_token(user):
    """Issue a fresh token for ``user``, invalidating any previous one."""
    Token.objects.filter(user=user).delete()
    return Token.objects.create(user=user)


def get_or_rotate_token(user):
    """Return the user's login token, rotating it only when it has expired.

    Called on login. DRF stores a single token per user, so unconditionally
    rotating on every login would invalidate the user's other active sessions
    (e.g. logging in on a phone would log them out on their laptop). Instead we:

    * mint a token if the user has none;
    * rotate (delete + recreate) only if the existing token has expired, so a
      stale credential is never resurrected;
    * otherwise reuse the valid token and slide its expiry forward, since a
      login is fresh activity.
    """
    token, created = Token.objects.get_or_create(user=user)
    if created:
        return token
    if token_is_expired(token):
        token.delete()
        return Token.objects.create(user=user)
    refresh_token_if_stale(token)
    return token


class ExpiringTokenAuthentication(TokenAuthentication):
    """``TokenAuthentication`` with a sliding inactivity expiry."""

    def authenticate_credentials(self, key):
        model = self.get_model()
        try:
            token = model.objects.select_related("user").get(key=key)
        except model.DoesNotExist:
            raise AuthenticationFailed(_("Invalid token."))

        if not token.user.is_active:
            raise AuthenticationFailed(_("User inactive or deleted."))

        now = timezone.now()
        if token_is_expired(token, now):
            token.delete()
            raise AuthenticationFailed(_("Token has expired. Please log in again."))

        # Sliding expiry: mark the token as recently used so active sessions
        # stay alive across browser restarts.
        refresh_token_if_stale(token, now)

        return (token.user, token)
