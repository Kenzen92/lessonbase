from django.urls import re_path

from . import consumers

print("Defining WebSocket URL patterns...")

websocket_urlpatterns = [
    re_path(
        r"ws/direct-chat/(?P<chat_id>[0-9a-f\-]+)/$",
        consumers.DirectChatConsumer.as_asgi(),
    ),
    re_path(
        r"ws/chat/(?P<room_name>[\w\-]+)/$", consumers.ClassroomChatConsumer.as_asgi()
    ),
    re_path(
        r"ws/whiteboard/(?P<room_name>[\w\-]+)/$",
        consumers.WhiteboardConsumer.as_asgi(),
    ),
    re_path(r"ws/webrtc/(?P<room_name>[\w\-]+)/$", consumers.WebRTCConsumer.as_asgi()),
]

print("WebSocket URL patterns defined.")
