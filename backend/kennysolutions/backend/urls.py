from django.urls import path, include

from apps.classes.views import AssignmentAttemptViewSet, ClassEventViewSet, class_material, class_report, student_statistics, teacher_statistics, class_events_for_student, HomeworkViewSet
from apps.user_accounts.views import ClassGroupViewSet, TeacherViewSet, StudentViewSet, confirm_account, login, logout, profile
from apps.subjects.views import all_subjects, subjects
from . import views
from rest_framework.routers import DefaultRouter

from apps.storage.views import serve_mongo_file

router = DefaultRouter()
router.register(r'assignment', HomeworkViewSet, basename='assignment')
router.register(r'class-group', ClassGroupViewSet, basename="class-group")
router.register(r'class-event', ClassEventViewSet, basename="class-event")
router.register(r'student', StudentViewSet, basename="student")
router.register(r'teacher', TeacherViewSet, basename="teacher")
router.register(r'assignment-attempt', AssignmentAttemptViewSet, basename="assignment-attempt")

urlpatterns = [
    path('profile/', profile),
    path('create_data', views.createData),
    path('login', login),
    path('logout/', logout),
    path('class-event/student/<int:student_id>/', class_events_for_student), 
    path('subjects/all', all_subjects),
    path('subjects/', subjects),
    path('confirm-account/', confirm_account, name='confirm_account'),
    path('chats/', views.ChatListCreateView.as_view(), name='chat-list-create'),
    path('chats/<int:chat_id>/messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('class_report', class_report, name="open-api"),
    path('class_material', class_material, name="open-api"),
    path('media/<str:collection>/<str:filename>/', serve_mongo_file, name='serve_mongo_file'),
    path('teacher-statistics', teacher_statistics, name='teacher_statistics'),
    path('student-statistics', student_statistics, name='student_statistics'),



    path('', include(router.urls)),
]
