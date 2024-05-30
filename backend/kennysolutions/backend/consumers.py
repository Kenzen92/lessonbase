import json
from .models import Chat, Message 
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from datetime import datetime

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("WebSocket connected.")
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        print("Room name:", self.room_name)
        self.room_group_name = f'chat_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        await self.load_chat_history(self.room_name)

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        print("Text adata arriving message", text_data_json )
        message = text_data_json['message']
        print("Scope:  ", self.scope)
        # Save message to database
        await self.save_message(self.room_name, self.scope["user"], message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'timestamp': datetime.now(),
                'sender': self.scope['user'].username
            }
        )

       
    async def chat_message(self, event):
        message = event['message']
        print("timestamp? :", event)

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'timestamp': event['timestamp'],
            'sender': event['sender']
        }))

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
            chat=room,
            sender=user,
            receiver=receiver,
            content=message
        )

    @sync_to_async
    def get_chat_history(self, room_name):
        # Retrieve or create the chat room
        room, created = Chat.objects.get_or_create(id=room_name)
        print(f"Room: {room}, created: {created}")
        
        # Debug: Print room details
        print(f"Room ID: {room.id}, Room Name: {room.name}")
        print(f"Room Participants: {[participant.username for participant in room.participants.all()]}")

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
            'message': message.content,
            'sender': message.sender.username,
            'timestamp': message.timestamp.isoformat()
        }