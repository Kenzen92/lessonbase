from collections import defaultdict
import asyncio
import json
import os
import weakref

import redis.asyncio as aioredis
from .models import Chat, Message, ClassroomChatMessage
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

# One client per event loop: a redis.asyncio client is bound to the loop it
# was created on, and the test runner (and any sync->async bridge) spins up
# fresh loops, so a module-level singleton would go stale.
_redis_clients = weakref.WeakKeyDictionary()


def get_redis():
    loop = asyncio.get_running_loop()
    client = _redis_clients.get(loop)
    if client is None:
        client = aioredis.from_url(
            os.environ.get("REDIS_URL", "redis://127.0.0.1:6379"),
            decode_responses=True,
        )
        _redis_clients[loop] = client
    return client


class DirectChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope["url_route"]["kwargs"]["chat_id"]
        self.room_group_name = f"direct_chat_{self.chat_id}"

        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        has_access = await self.verify_chat_access(self.chat_id, user)
        if not has_access:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.load_chat_history(self.chat_id)

    @sync_to_async
    def verify_chat_access(self, chat_id, user):
        try:
            return Chat.objects.filter(id=chat_id, participants=user).exists()
        except ValueError:
            return False

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        saved_message = await self.save_message(
            self.chat_id, self.scope["user"], message
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "timestamp": saved_message.timestamp.isoformat(),
                "sender": self.scope["user"].username,
                "sender_id": self.scope["user"].id,
            },
        )

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "message": event["message"],
                    "timestamp": event["timestamp"],
                    "sender": event["sender"],
                    "sender_id": event["sender_id"],
                }
            )
        )

    @sync_to_async
    def save_message(self, chat_id, user, message):
        chat = Chat.objects.get(id=chat_id)
        receiver = chat.participants.exclude(id=user.id).first()
        if receiver is None:
            raise ValueError("Receiver not found")

        return Message.objects.create(
            chat=chat,
            sender=user,
            receiver=receiver,
            content=message,
        )

    @sync_to_async
    def get_chat_history(self, chat_id):
        return Message.objects.filter(chat_id=chat_id).select_related("sender")

    async def load_chat_history(self, chat_id):
        messages = await self.get_chat_history(chat_id)

        for message in await sync_to_async(list)(messages):
            message_data = await self.get_message_data(message)
            await self.send(text_data=json.dumps(message_data))

    @sync_to_async
    def get_message_data(self, message):
        return {
            "message": message.content,
            "sender": message.sender.username,
            "sender_id": message.sender_id,
            "timestamp": message.timestamp.isoformat(),
        }


class ClassroomChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"classroom_chat_{self.room_name}"

        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        has_access = await self.verify_classroom_access(self.room_name, user)
        if not has_access:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.load_chat_history(self.room_name)

    @sync_to_async
    def verify_classroom_access(self, access_token, user):
        from apps.classes.models import ClassEvent

        try:
            classroom = ClassEvent.objects.get(
                access_token=access_token, is_active=True
            )
            if classroom.is_expired():
                return False
            return classroom.can_access(user)
        except ClassEvent.DoesNotExist:
            return False

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        saved_message = await self.save_message(
            self.room_name, self.scope["user"], message
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": saved_message.content,
                "timestamp": saved_message.timestamp.isoformat(),
                "sender": saved_message.sender.username,
                "sender_id": saved_message.sender_id,
            },
        )

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "message": event["message"],
                    "timestamp": event["timestamp"],
                    "sender": event["sender"],
                    "sender_id": event["sender_id"],
                }
            )
        )

    @sync_to_async
    def save_message(self, access_token, user, message):
        from apps.classes.models import ClassEvent

        classroom = ClassEvent.objects.get(access_token=access_token, is_active=True)
        return ClassroomChatMessage.objects.create(
            classroom=classroom,
            sender=user,
            content=message,
        )

    @sync_to_async
    def get_chat_history(self, access_token):
        return ClassroomChatMessage.objects.filter(
            classroom__access_token=access_token,
            classroom__is_active=True,
        ).select_related("sender")

    async def load_chat_history(self, access_token):
        messages = await self.get_chat_history(access_token)

        for message in await sync_to_async(list)(messages):
            await self.send(
                text_data=json.dumps(
                    {
                        "message": message.content,
                        "sender": message.sender.username,
                        "sender_id": message.sender_id,
                        "timestamp": message.timestamp.isoformat(),
                    }
                )
            )


SCENE_TTL_SECONDS = 60 * 60 * 24  # scenes expire a day after the last edit
MAX_FILE_BYTES = 4 * 1024 * 1024  # per embedded image (serialized)


def element_wins(candidate, stored):
    """Excalidraw reconciliation rule: higher version wins; on a version
    tie the lower versionNonce wins (matching the client's reconcileElements)."""
    cv = candidate.get("version", 0)
    sv = stored.get("version", 0)
    if cv != sv:
        return cv > sv
    return candidate.get("versionNonce", 0) < stored.get("versionNonce", 0)


class WhiteboardConsumer(AsyncWebsocketConsumer):
    """Sync layer for the collaborative Excalidraw board.

    The scene is a flat map of versioned Excalidraw elements plus a map of
    binary files (embedded images). State lives in Redis hashes so it
    survives restarts and is shared across workers. Deleted elements remain
    in the map with isDeleted=true so deletions propagate to late joiners;
    the whole scene expires via TTL.
    """

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"whiteboard_{self.room_name}"

        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        has_access = await self.verify_classroom_access(self.room_name, user)
        if not has_access:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.send_snapshot()

    @sync_to_async
    def verify_classroom_access(self, access_token, user):
        from apps.classes.models import ClassEvent

        try:
            classroom = ClassEvent.objects.get(
                access_token=access_token, is_active=True
            )
            if classroom.is_expired():
                return False
            return classroom.can_access(user)
        except ClassEvent.DoesNotExist:
            return False

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    @property
    def elements_key(self):
        return f"whiteboard:{self.room_name}:elements"

    @property
    def files_key(self):
        return f"whiteboard:{self.room_name}:files"

    async def send_snapshot(self):
        r = get_redis()
        raw_elements = await r.hvals(self.elements_key)
        raw_files = await r.hgetall(self.files_key)

        elements = [json.loads(e) for e in raw_elements]
        # Excalidraw fractional indices sort lexicographically; preserve z-order.
        elements.sort(key=lambda el: el.get("index") or "")
        files = {fid: json.loads(f) for fid, f in raw_files.items()}

        await self.send(
            text_data=json.dumps(
                {
                    "type": "scene_snapshot",
                    "payload": {"elements": elements, "files": files},
                }
            )
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return
        event_type = data.get("type")
        payload = data.get("payload") or {}

        if event_type == "scene_update":
            accepted, new_files = await self.apply_scene_update(payload)
            if accepted or new_files:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "broadcast_event",
                        "event_type": "scene_update",
                        "payload": {"elements": accepted, "files": new_files},
                        "sender_channel": self.channel_name,
                    },
                )

        elif event_type == "pointer":
            # Ephemeral presence: relay only, never stored.
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_event",
                    "event_type": "pointer",
                    "payload": payload,
                    "sender_channel": self.channel_name,
                },
            )

        elif event_type == "request_snapshot":
            await self.send_snapshot()

    async def apply_scene_update(self, payload):
        """Reconcile incoming elements/files into Redis; return what was accepted."""
        r = get_redis()
        accepted = []
        for el in payload.get("elements") or []:
            if not isinstance(el, dict) or not el.get("id"):
                continue
            el_id = str(el["id"])
            stored_raw = await r.hget(self.elements_key, el_id)
            if stored_raw is not None and not element_wins(el, json.loads(stored_raw)):
                continue
            await r.hset(self.elements_key, el_id, json.dumps(el))
            accepted.append(el)

        new_files = {}
        for fid, f in (payload.get("files") or {}).items():
            if not isinstance(f, dict):
                continue
            blob = json.dumps(f)
            if len(blob) > MAX_FILE_BYTES:
                continue
            if not await r.hexists(self.files_key, str(fid)):
                await r.hset(self.files_key, str(fid), blob)
                new_files[str(fid)] = f

        if accepted or new_files:
            await r.expire(self.elements_key, SCENE_TTL_SECONDS)
            await r.expire(self.files_key, SCENE_TTL_SECONDS)
        return accepted, new_files

    async def broadcast_event(self, event):
        if event.get("sender_channel") == self.channel_name:
            return
        await self.send(
            text_data=json.dumps(
                {"type": event["event_type"], "payload": event["payload"]}
            )
        )


class WebRTCConsumer(AsyncWebsocketConsumer):
    # Class-level storage: room_name -> {channel_name: {username, user_type}}
    room_users = defaultdict(dict)

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"webrtc_{self.room_name}"

        user = self.scope.get("user")

        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        has_access = await self.verify_classroom_access(self.room_name, user)
        if not has_access:
            await self.close(code=4003)
            return

        self.username = user.username
        self.user_type = await self.get_user_type(user)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Track this user in the room.
        WebRTCConsumer.room_users[self.room_name][self.channel_name] = {
            "username": self.username,
            "user_type": self.user_type,
        }

        # Send the list of already-connected users to the new joiner.
        existing_users = [
            info
            for ch, info in WebRTCConsumer.room_users[self.room_name].items()
            if ch != self.channel_name
        ]
        await self.send(
            text_data=json.dumps(
                {"type": "room_state", "payload": {"users": existing_users}}
            )
        )

        # Broadcast user_joined to everyone else.
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "relay_event",
                "event_type": "user_joined",
                "payload": {
                    "username": self.username,
                    "userType": self.user_type,
                },
                "sender_channel": self.channel_name,
            },
        )

    @sync_to_async
    def verify_classroom_access(self, access_token, user):
        from apps.classes.models import ClassEvent

        try:
            classroom = ClassEvent.objects.get(
                access_token=access_token, is_active=True
            )
            if classroom.is_expired():
                return False
            return classroom.can_access(user)
        except ClassEvent.DoesNotExist:
            return False

    @sync_to_async
    def get_user_type(self, user):
        from apps.user_accounts.models import Teacher

        real_user = user.get_real_instance()
        return "teacher" if isinstance(real_user, Teacher) else "student"

    async def disconnect(self, close_code):
        # Remove from tracking.
        WebRTCConsumer.room_users.get(self.room_name, {}).pop(self.channel_name, None)

        # Clean up empty rooms.
        if (
            self.room_name in WebRTCConsumer.room_users
            and not WebRTCConsumer.room_users[self.room_name]
        ):
            del WebRTCConsumer.room_users[self.room_name]

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "relay_event",
                "event_type": "user_left",
                "payload": {
                    "username": getattr(self, "username", ""),
                    "userType": getattr(self, "user_type", ""),
                },
                "sender_channel": self.channel_name,
            },
        )

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get("type")
        payload = data.get("payload", {})

        # Relay signaling messages to the rest of the group.
        if event_type in (
            "offer",
            "answer",
            "description",
            "ice_candidate",
            "call_end",
            "media_state",
            "screen_share",
        ):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "relay_event",
                    "event_type": event_type,
                    "payload": payload,
                    "sender_channel": self.channel_name,
                },
            )

    async def relay_event(self, event):
        if event.get("sender_channel") == self.channel_name:
            return
        await self.send(
            text_data=json.dumps(
                {
                    "type": event["event_type"],
                    "payload": event["payload"],
                }
            )
        )
