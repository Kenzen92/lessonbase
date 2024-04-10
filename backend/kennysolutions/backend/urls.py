from django.urls import path
from . import views

urlpatterns = [
    path('', views.getData),
    path('create_data', views.createData),
    path('register_user', views.userRegister),
    path('login', views.login)
]
