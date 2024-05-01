from django.urls import path
from . import views

urlpatterns = [
    path('', views.getData),
    path('create_data', views.createData),
    path('register_user', views.userRegister),
    path('login', views.login),
    path('students', views.students),
    path('teachers', views.teachers),
    path('students-for-teacher', views.students_for_teacher),
    path('add-students', views.connect_student_teacher),
    path('class/', views.class_events),  # URL pattern for GET all class events
    path('class/<int:class_id>/', views.class_events),  # URL pattern for GET, DELETE class event by ID
    path('subjects/all', views.all_subjects),
    path('subjects/', views.subjects)

]
