from collections import defaultdict
import json
from .models import Chat, Message
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from datetime import datetime


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("WebSocket connected.")
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Get user from scope (set by TokenAuthMiddleware)
        user = self.scope.get("user")

        # Reject if user is not authenticated
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        # Verify classroom access
        has_access = await self.verify_classroom_access(self.room_name, user)
        if not has_access:
            await self.close(code=4003)
            return

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Only load chat history once
        await self.load_chat_history(self.room_name)

    @sync_to_async
    def verify_classroom_access(self, access_token, user):
        """Verify that the user has access to this classroom"""
        from apps.classes.models import ClassEvent

        try:
            classroom = ClassEvent.objects.get(
                access_token=access_token, is_active=True
            )

            # Check if classroom has expired
            if classroom.is_expired():
                return False

            # Check if user is a teacher or student in this classroom
            return classroom.can_access(user)
        except ClassEvent.DoesNotExist:
            return False

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        # Save message to the database
        await self.save_message(self.room_name, self.scope["user"], message)

        # Send message to room group without reconnecting WebSocket
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "timestamp": datetime.now().isoformat(),
                "sender": self.scope["user"].username,
            },
        )

    async def chat_message(self, event):
        message = event["message"]
        print("timestamp? :", event)

        # Send message to WebSocket
        await self.send(
            text_data=json.dumps(
                {
                    "message": message,
                    "timestamp": event["timestamp"],
                    "sender": event["sender"],
                }
            )
        )

    @sync_to_async
    def save_message(self, room_name, user, message):
        # Retrieve or create the chat room
        room, created = Chat.objects.get_or_create(id=room_name)
        print(f"Room: {room}, created: {created}")

        # Get all participants in the chat
        participants = room.participants.all()
        print("Participants in chat: ", participants)

        if not participants.exists():
            raise ValueError("Receiver not found")

        # Assuming the receiver is another participant who is not the sender
        receiver = participants.first()

        # Create the message
        Message.objects.create(
            chat=room, sender=user, receiver=receiver, content=message
        )

    @sync_to_async
    def get_chat_history(self, room_name):
        # Retrieve or create the chat room
        room, created = Chat.objects.get_or_create(id=room_name)
        print(f"Room: {room}, created: {created}")

        # Debug: Print room details
        print(f"Room ID: {room.id}, Room Name: {room.name}")
        print(
            f"Room Participants: {[participant.username for participant in room.participants.all()]}"
        )

        # Fetch messages in the chat room
        messages = Message.objects.filter(chat=room)

        # Debug: Print the number of messages found
        print(f"Number of messages found: {messages.count()}")

        return messages

    async def load_chat_history(self, room_name):
        # Load chat history from the database
        messages = await self.get_chat_history(room_name)

        for message in await sync_to_async(list)(messages):
            # Extract message data synchronously
            message_data = await self.get_message_data(message)

            # Send message data to the WebSocket
            await self.send(text_data=json.dumps(message_data))

    @sync_to_async
    def get_message_data(self, message):
        # Extract message data synchronously
        return {
            "message": message.content,
            "sender": message.sender.username,
            "timestamp": message.timestamp.isoformat(),
        }


class WhiteboardState:
    def __init__(self):
        self.lines = []
        self.current_lines = {}  # Store in-progress lines
        self.history = [[]]
        self.history_step = 0


class WhiteboardConsumer(AsyncWebsocketConsumer):
    # Class-level storage for room states
    room_states = defaultdict(WhiteboardState)

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"whiteboard_{self.room_name}"

        # Get user from scope (set by TokenAuthMiddleware)
        user = self.scope.get("user")

        # Reject if user is not authenticated
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        # Verify classroom access
        has_access = await self.verify_classroom_access(self.room_name, user)
        if not has_access:
            await self.close(code=4003)
            return

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

        # Send current state to new connection
        state = self.room_states[self.room_name]
        await self.send(
            text_data=json.dumps(
                {
                    "type": "sync_response",
                    "payload": {
                        "lines": state.lines,
                        "history": state.history,
                        "historyStep": state.history_step,
                    },
                }
            )
        )

    @sync_to_async
    def verify_classroom_access(self, access_token, user):
        """Verify that the user has access to this classroom"""
        from apps.classes.models import ClassEvent

        try:
            classroom = ClassEvent.objects.get(
                access_token=access_token, is_active=True
            )

            # Check if classroom has expired
            if classroom.is_expired():
                return False

            # Check if user is a teacher or student in this classroom
            return classroom.can_access(user)
        except ClassEvent.DoesNotExist:
            return False

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get("type")
        payload = data.get("payload", {})

        state = self.room_states[self.room_name]
        print(f"Received event: {event_type} with payload: {payload}")

        if event_type == "draw_start":
            # Add new line to current lines
            line = payload["line"]
            state.current_lines[line["id"]] = line
            state.lines.append(line)

            # Broadcast to group (excluding sender)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_event",
                    "event_type": "draw_start",
                    "payload": payload,
                    "sender_channel": self.channel_name,
                },
            )

        elif event_type == "draw_update":
            line_id = payload["lineId"]
            new_points = payload["newPoints"]

            if line_id in state.current_lines:
                # Update the line with new points
                current_line = state.current_lines[line_id]
                current_line["points"].extend(new_points)

                # Update the line in the main lines array
                line_index = next(
                    i for i, line in enumerate(state.lines) if line["id"] == line_id
                )
                state.lines[line_index] = current_line

                # Broadcast update (excluding sender)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "broadcast_event",
                        "event_type": "draw_update",
                        "payload": payload,
                        "sender_channel": self.channel_name,
                    },
                )

        elif event_type == "draw_end":
            line_id = payload["lineId"]
            if line_id in state.current_lines:
                # Remove from current lines
                del state.current_lines[line_id]

                # Update history
                state.history = state.history[: state.history_step + 1]
                state.history.append(list(state.lines))
                state.history_step = len(state.history) - 1

                # Broadcast completion (excluding sender)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "broadcast_event",
                        "event_type": "draw_end",
                        "payload": {
                            "lineId": line_id,
                            "historyStep": state.history_step,
                        },
                        "sender_channel": self.channel_name,
                    },
                )

        elif event_type == "undo":
            if state.history_step > 0:
                state.history_step -= 1
                state.lines = list(state.history[state.history_step])
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "broadcast_event",
                        "event_type": "undo",
                        "payload": {"historyStep": state.history_step},
                        "sender_channel": self.channel_name,
                    },
                )

        elif event_type == "redo":
            if state.history_step < len(state.history) - 1:
                state.history_step += 1
                state.lines = list(state.history[state.history_step])
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "broadcast_event",
                        "event_type": "redo",
                        "payload": {"historyStep": state.history_step},
                        "sender_channel": self.channel_name,
                    },
                )

        elif event_type == "text_update":
            text_id = payload["textId"]
            text_content = payload["text"]

            # Find and update the text in state
            for line in state.lines:
                if line.get("id") == text_id:
                    line["text"] = text_content
                    break

            # Broadcast text update (excluding sender)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_event",
                    "event_type": "text_update",
                    "payload": payload,
                    "sender_channel": self.channel_name,
                },
            )

        elif event_type == "text_move":
            text_id = payload["textId"]
            x = payload["x"]
            y = payload["y"]

            # Find and update the text position in state
            for line in state.lines:
                if line.get("id") == text_id:
                    line["x"] = x
                    line["y"] = y
                    break

            # Broadcast position update (excluding sender)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_event",
                    "event_type": "text_move",
                    "payload": payload,
                    "sender_channel": self.channel_name,
                },
            )

        elif event_type == "shape_delete":
            shape_id = payload["shapeId"]

            # Remove the shape from state
            state.lines = [line for line in state.lines if line.get("id") != shape_id]

            # Remove from current lines if it's there
            if shape_id in state.current_lines:
                del state.current_lines[shape_id]

            # Broadcast delete (excluding sender)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_event",
                    "event_type": "shape_delete",
                    "payload": payload,
                    "sender_channel": self.channel_name,
                },
            )

        elif event_type == "shape_move":
            shape_id = payload["shapeId"]
            shape = payload["shape"]

            # Find and update the shape in state
            for i, line in enumerate(state.lines):
                if line.get("id") == shape_id:
                    state.lines[i] = shape
                    break

            # Broadcast shape move (excluding sender)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_event",
                    "event_type": "shape_move",
                    "payload": payload,
                    "sender_channel": self.channel_name,
                },
            )

        elif event_type == "clear":
            print("Clearing whiteboard state for room:", self.room_name)
            print(state.lines)
            state.lines = []
            state.current_lines = {}
            state.history = [[]]
            state.history_step = 0
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_event",
                    "event_type": "clear",
                    "payload": {},
                    "sender_channel": self.channel_name,
                },
            )

    async def broadcast_event(self, event):
        # Skip sending to the original sender to prevent echo
        if event.get("sender_channel") == self.channel_name:
            return

        # Send event to WebSocket
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
        if event_type in ("offer", "answer", "ice_candidate", "call_end"):
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
