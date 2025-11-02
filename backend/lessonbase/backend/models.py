from django.db import models

from apps.user_accounts.models import CustomAccount

class Chat(models.Model):
    participants = models.ManyToManyField(CustomAccount)
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=100)

class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    sender = models.ForeignKey(CustomAccount, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(CustomAccount, related_name='received_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)


