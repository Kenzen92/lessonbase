from django.urls import path
from . import views

urlpatterns = [
    path('', views.getData),
    path('create_data', views.createData),
    path('register_teacher', views.teacherRegister),
        path('register_student', views.studentRegister),
    path('login', views.login)
]
