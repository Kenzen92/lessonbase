from django.db import models
import uuid
from apps.user_accounts.models import CustomAccount
from apps.classes.models import ClassEvent


class Chat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(CustomAccount)
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=100)


class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    sender = models.ForeignKey(
        CustomAccount, related_name="sent_messages", on_delete=models.CASCADE
    )
    receiver = models.ForeignKey(
        CustomAccount, related_name="received_messages", on_delete=models.CASCADE
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)


class ClassroomChatMessage(models.Model):
    classroom = models.ForeignKey(
        ClassEvent, on_delete=models.CASCADE, related_name="chat_messages"
    )
    sender = models.ForeignKey(
        CustomAccount,
        related_name="classroom_sent_messages",
        on_delete=models.CASCADE,
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
