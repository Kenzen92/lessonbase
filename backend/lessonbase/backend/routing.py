from django.urls import re_path
from backend import consumers


print("Defining WebSocket URL patterns...")

websocket_urlpatterns = [
    # Updated regex to support URL-safe tokens (letters, digits, hyphens, underscores)
    re_path(r'ws/chat/(?P<room_name>[\w\-]+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/whiteboard/(?P<room_name>[\w\-]+)/$', consumers.WhiteboardConsumer.as_asgi()),
]

print("WebSocket URL patterns defined.")
