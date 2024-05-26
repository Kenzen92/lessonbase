from django.urls import re_path
from backend import consumers

print("Defining WebSocket URL patterns...")

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]

print("WebSocket URL patterns defined.")
