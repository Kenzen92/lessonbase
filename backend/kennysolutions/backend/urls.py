from django.urls import path

from apps.classes.views import class_events, class_material, class_report, homework, teacher_statistics
from apps.user_accounts.views import confirm_account, connect_student_teacher, login, logout, new_student, profile, students, students_for_teacher, teachers, userRegister
from apps.subjects.views import all_subjects, subjects
from . import views


from apps.storage.views import serve_mongo_file

urlpatterns = [
    path('create_data', views.createData),
    path('register_user', userRegister),
    path('login', login),
    path('logout/', logout),
    path('students', students),
    path('teachers', teachers),
    path('students-for-teacher', students_for_teacher),
    path('add-students', connect_student_teacher),
    path('class/', class_events),
    path('class/<int:class_id>/', class_events), 
    path('subjects/all', all_subjects),
    path('subjects/', subjects),
    path('profile/', profile),
    path('new-student/', new_student),
    path('confirm-account/', confirm_account, name='confirm_account'),
    path('chats/', views.ChatListCreateView.as_view(), name='chat-list-create'),
    path('chats/<int:chat_id>/messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('class_report', class_report, name="open-api"),
    path('class_material', class_material, name="open-api"),
    path('homework', homework, name="homework-api"),
    path('media/fs/<str:collection>/<str:filename>/', serve_mongo_file, name='serve_mongo_file'),
    path('teacher-statistics', teacher_statistics, name='teacher_statistics')
]
