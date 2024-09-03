from django.urls import path
from . import views
from apps.storage.views import serve_mongo_file

urlpatterns = [
    path('', views.getData),
    path('create_data', views.createData),
    path('register_user', views.userRegister),
    path('login', views.login),
    path('logout/', views.logout),
    path('students', views.students),
    path('teachers', views.teachers),
    path('students-for-teacher', views.students_for_teacher),
    path('add-students', views.connect_student_teacher),
    path('class/', views.class_events),
    path('class/<int:class_id>/', views.class_events), 
    path('subjects/all', views.all_subjects),
    path('subjects/', views.subjects),
    path('profile/', views.profile),
    path('new-student/', views.new_student),
    path('confirm-account/', views.confirm_account, name='confirm_account'),
    path('chats/', views.ChatListCreateView.as_view(), name='chat-list-create'),
    path('chats/<int:chat_id>/messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('class_report', views.class_report, name="open-api"),
    path('class_material', views.class_material, name="open-api"),
    path('homework', views.homework, name="homework-api"),
    path('media/fs/<str:collection>/<str:filename>/', serve_mongo_file, name='serve_mongo_file'),
]
