# backend/middleware.py
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from rest_framework.authtoken.models import Token

from .authentication import token_is_expired, refresh_token_if_stale


@database_sync_to_async
def get_user(token_key):
    try:
        token = Token.objects.get(key=token_key)
    except Token.DoesNotExist:
        return AnonymousUser()

    # Apply the same expiry/rotation rules as the HTTP API so a stale token
    # can't be used to open a WebSocket connection. These operate on the token
    # itself; token.user is then resolved via the (polymorphic) related manager
    # exactly as before, which eagerly loads the content type and keeps the
    # later str(user) safe to call from this async middleware.
    if token_is_expired(token):
        token.delete()
        return AnonymousUser()

    refresh_token_if_stale(token)
    return token.user

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Extract the token from the query string
        query_string = scope['query_string'].decode()
        print("Query String:", query_string)
        if not query_string:
            scope['user'] = AnonymousUser()
            return await super().__call__(scope, receive, send)
        query_params = dict(x.split('=') for x in query_string.split('&'))
        print("Query Params:", query_params)
        token_key = query_params.get('token', None)
        print("Token Key:", token_key )
        
        if token_key:
            scope['user'] = await get_user(token_key)
        else:
            scope['user'] = AnonymousUser()
        
        print("Authenticated User:", scope['user'])

        return await super().__call__(scope, receive, send)
