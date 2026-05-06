from rest_framework import serializers
from apps.user_accounts.models import Teacher
from .models import Chat, Message


class TeacherClassEventSerializer(serializers.ModelSerializer):

    class Meta:
        model = Teacher
        fields = ["username"]


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = "__all__"


class ChatSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = ["id", "participants", "messages"]
