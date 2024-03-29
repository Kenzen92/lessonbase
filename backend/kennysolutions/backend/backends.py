from django.contrib.auth.backends import BaseBackend
from .models import CustomUser, CustomerAccount, Teacher, Student

class CustomUserBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None):
        try:
            print(username)
            print(password)
            customuser = CustomUser.objects.get(username=username)
            print(customuser.is_student)
            print(customuser)
            if customuser.check_password(password):
                return customuser
        except CustomUser.DoesNotExist:
            pass
                
        return None
