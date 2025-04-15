from collections import defaultdict
import datetime
import json
from django.db.models import Count, Sum, Q, Case, When, Value
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from apps.storage.storage_backends import GridFSStorage
from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework import status
from apps.user_accounts.models import Student, Teacher
from apps.subjects.models import Subject
from apps.classes.serialisers import  ClassEventSerializer, ClassEventCreateSerializer
from django.core.exceptions import ValidationError
from .serialisers import  AssignmentAttemptCreateSerializer, AssignmentAttemptDetailsSerializer, AssignmentDetailsSerializer, AssignmentListSerializer, ClassEventDateOrderedSerializer, ClassEventSerializer
from .models import Assignment, AssignmentAttempt, ClassEvent,  TeachingResource
from rest_framework import viewsets
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Count, Sum, Avg, F, Q


class ClassEventViewSet(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ClassEventCreateSerializer
        if self.action == 'list':
            return ClassEventDateOrderedSerializer
        else:
            return ClassEventSerializer

    def list(self, request):
        user = request.user.get_real_instance()
        if isinstance(user, Teacher):
            class_events = ClassEvent.objects.filter(teachers=user).distinct().select_related('subject').prefetch_related('students')
        else:
            class_events = ClassEvent.objects.filter(students=user).distinct().select_related('subject').prefetch_related('teachers')
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(class_events, many=True)
        return Response(serializer.data)

    def create(self, request):
        print(request.data )
        teacher_ids = [request.user.pk]
        student_ids = request.data.get('students', [])
        teachers = Teacher.objects.filter(pk__in=teacher_ids)
        students = Student.objects.filter(pk__in=student_ids)
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(data=request.data)
        if serializer.is_valid():
            class_event = serializer.save()
            class_event.teachers.set(teachers)
            class_event.students.set(students)
            return Response({"message": "Class event created successfully"}, status=status.HTTP_201_CREATED)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        try:
            class_event = ClassEvent.objects.get(id=pk)
            serializer = ClassEventSerializer(class_event)
            return Response(serializer.data)
        except ClassEvent.DoesNotExist:
            return Response({'error': 'Class event not found'}, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, pk=None):
        return self._update_class_event(request, pk, partial=False)

    def partial_update(self, request, pk=None):
        return self._update_class_event(request, pk, partial=True)

    def destroy(self, request, pk=None):
        try:
            class_event = ClassEvent.objects.get(id=pk)
            class_event.delete()
            return Response({'message': 'Class event deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except ClassEvent.DoesNotExist:
            return Response({'error': 'Class event not found'}, status=status.HTTP_404_NOT_FOUND)

    def _update_class_event(self, request, pk, partial):
        if not pk:
            return Response({"error": "Class event ID is required for updating"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            class_event = ClassEvent.objects.get(id=pk)
        except ClassEvent.DoesNotExist:
            return Response({"error": "Class event not found"}, status=status.HTTP_404_NOT_FOUND)

        teacher_ids = [request.user.pk]
        student_ids = request.data.get('students', [])
        teachers = Teacher.objects.filter(pk__in=teacher_ids)
        students = Student.objects.filter(pk__in=student_ids)
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(class_event, data=request.data, partial=partial)
        if serializer.is_valid():
            class_event = serializer.save()
            class_event.teachers.set(teachers)
            class_event.students.set(students)
            return Response({"message": "Class event updated successfully"}, status=status.HTTP_200_OK)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST', 'DELETE', 'PUT', 'PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def class_events_for_student(request, student_id=None):
    if request.method == 'GET':
        class_events = ClassEvent.objects.filter(students=student_id)
        serializer = ClassEventSerializer(class_events, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def student_statistics(request):
    page = request.GET.get("page")
    try:
        student = Student.objects.get(pk=request.user.id)
        current_datetime = datetime.now()

        # Common Queries
        total_classes = ClassEvent.objects.filter(students=student).count()
        completed_classes = ClassEvent.objects.filter(students=student, start_time__lt=current_datetime).count()
        upcoming_classes = ClassEvent.objects.filter(students=student, start_time__gte=current_datetime).count()
        total_assignments = Assignment.objects.filter(students=student).count()

        if page == "dashboard":
            stats = {
                "total_classes": total_classes,
                "completed_classes": completed_classes,
                "upcoming_classes": upcoming_classes,
            }

        elif page == "assignments":
            stats = {
                "total_assignments": total_assignments,
                "total_documents" : TeachingResource.objects.filter(homework_resource__students=student).distinct().count(),
            }

        else:
            return Response({"error": "Invalid page parameter"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"data": stats}, status=status.HTTP_200_OK)

    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def teacher_statistics(request):
    page = request.GET.get("page")
    
    try:
        teacher = Teacher.objects.get(pk=request.user.id)
        current_datetime = datetime.now()
        
        # Common Queries
        total_students = teacher.students.count()
        total_classes = ClassEvent.objects.filter(teachers=teacher).count()
        completed_classes = ClassEvent.objects.filter(teachers=teacher, start_time__lt=current_datetime).count()
        upcoming_classes = ClassEvent.objects.filter(teachers=teacher, start_time__gte=current_datetime).count()
        total_assignments = Assignment.objects.filter(teachers=teacher).count()

        if page == "dashboard":
            stats = {
                "total_students": total_students,
                "total_classes": total_classes,
                "upcoming_classes": upcoming_classes,
                "total_assignments": total_assignments,
                "pending_assignments": Assignment.objects.filter(teachers=teacher, marked=False).count(),
                "total_teaching_hours": ClassEvent.objects.filter(teachers=teacher, start_time__lt=current_datetime).aggregate(Sum("duration"))["duration__sum"] or 0
            }

        elif page == "students":
            stats = {
                "total_students": total_students,
                "active_students": teacher.students.filter(is_confirmed=True).count(),
                "inactive_students": teacher.students.filter(is_confirmed=False).count(),
                "avg_assignments_per_student": round(total_assignments / total_students, 2) if total_students else 0,
            }

        elif page == "classes":
            stats = {
                "total_classes": total_classes,
                "completed_classes": completed_classes,
                "upcoming_classes": upcoming_classes,
                "average_class_duration": round(ClassEvent.objects.filter(teachers=teacher).aggregate(Avg("duration"))["duration__avg"], 2) or 0,
            }

        elif page == "assignments":
            stats = {
                "total_assignments": total_assignments,
                "total_documents" : TeachingResource.objects.filter(homework_resource__teachers=teacher).distinct().count(),
            }

        else:
            return Response({"error": "Invalid page parameter"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"data": stats}, status=status.HTTP_200_OK)
    
    except Teacher.DoesNotExist:
        return Response({"error": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)

    


@api_view(['POST', 'DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def class_material(request):
    if request.method == 'POST':
        # Ensure class_id is provided
        print(request.data)
        class_id = request.data.get('class_id')
        if class_id is None:
            return Response({"error": "class_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract class event from class_id (assuming it's part of TeachingResourceSerializer)
        try:
            class_event = ClassEvent.objects.get(id=class_id)  # Replace with actual model query
            print(class_event)
        except ClassEvent.DoesNotExist:
            return Response({"error": "Class event not found"}, status=status.HTTP_404_NOT_FOUND)

        # Handle file uploads
        files = request.FILES.getlist('file')  # getlist to handle multiple files
        print(files)
        if not files:
            return Response({"error": "No files provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Process each file individually
        for uploaded_file in files:
            # Create a GridFSStorage instance and save the file
            gridfs_storage = GridFSStorage(collection="fs")  # Pass parameters if necessary
            file_name = gridfs_storage._save(uploaded_file.name, uploaded_file, context='teaching_resource')
            file_url = gridfs_storage.url(file_name)

            # Create a new TeachingResource instance
            teaching_resource = TeachingResource(
                name=file_name,
                file=file_url,
                subject=class_event.subject,
                class_event=class_event
            )

            try:
                teaching_resource.save()
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"message": "Teaching resources created successfully"}, status=status.HTTP_201_CREATED)
    
    else:
        # Handle delete request 
        file_url = request.data.get("file_url")
        resource = TeachingResource.objects.filter(file=file_url).first()
        if resource:
            resource.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def class_report(request):
    class_id = request.data.get('classID')  # Assuming the class ID is passed as a query parameter
    if class_id is None:
        return Response({"error": "classID is required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        class_event = ClassEvent.objects.get(id=class_id)
    except ClassEvent.DoesNotExist:
        return Response({"error": "Class event not found"}, status=status.HTTP_404_NOT_FOUND)

    # Extract necessary information
    student_name = class_event.students.first()
    time_of_class = class_event.start_time
    subject = class_event.subject.name
    duration = class_event.duration

    # Prepare the context for the LLM
    class_summary = request.data.get("lesson_summary")

    # Prepare the context for the LLM
    class_summary = request.data.get("lesson_summary", "No summary provided")

   
    context = f"""
    You are a teacher's digital assistant. After the teacher conducts each class, you should receive a summary of it and its content
    and then use that summary to create a formal report. You should also set a suitable 10-minute homework task based on the lesson contents.
    Your answer should contain two sections with heading as follows:
    Summary: <summary>
    Homework: <homework task>

    Student Name: {student_name}
    Time of Class: {time_of_class}
    Subject: {subject}
    Duration: {duration}
    Teacher's summary: {class_summary}  
    """

    # Initialize OpenAI client and request a completion
    client = OpenAI()
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": context}
        ]
    )
    # Split the text into summary and homework sections
    summary_start = completion.choices[0].message.content.find("Summary:")
    homework_start = completion.choices[0].message.content.find("Homework:")

    summary = completion.choices[0].message.content[summary_start + len("Summary:"):homework_start].strip()
    homework = completion.choices[0].message.content[homework_start + len("Homework:"):].strip()

    # Create a new document
    document = Document()
    document.add_heading(f"{student_name}'s Class Report", 0)

    table = document.add_table(rows=5, cols=1)
    table.rows[0].cells[0].text = f"Course: {subject}"
    table.rows[1].cells[0].text = f"Date: {time_of_class}"
    table.rows[2].cells[0].text = f"Duration: {duration} minutes"
    table.rows[3].cells[0].text = f"Class Summary: {summary}"
    table.rows[4].cells[0].text = f"Homework: {homework}"


    # Save the document
    document.save('demo.docx')

    # Extract the message content correctly
    message_content = completion.choices[0].message.content
    return JsonResponse({"message": message_content})


class HomeworkViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing homework assignments.
    """
    serializer_class = AssignmentDetailsSerializer
    queryset = Assignment.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return AssignmentListSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        user = self.request.user
        return (
            Assignment.objects.filter(teachers=user)
            .select_related('subject')
            .prefetch_related('teachers', 'material')
        )
    
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        data['teachers'] = [self.request.user.pk]  
        # Pass the modified data to the serializer
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def list(self, request):
        # Define the current time
        now = timezone.now().date()
        # Annotate each assignment with its category based on conditions
        assignments = self.get_queryset().annotate(
            category=Case(
                When(Q(due_date__lte=now) & Q(marked=False), then=Value('Overdue')),
                When(Q(marked=False) & Q(due_date__lt=now) & Q(due_date__gt=now), then=Value('To Mark')),
                When(Q(created_at__date=now) & Q(due_date__gt=now), then=Value('Set')),
                When(Q(due_date__gt=now) & Q(marked=False), then=Value('Upcoming')),
                When(Q(marked=True), then=Value('Marked'))
            )
        )

        # Serialize assignments by category
        categorized_data = {
            "Overdue": [],
            "To Mark": [],
            "Set": [],
            "Upcoming": [],
            "Marked": [],
        }

        # Assign each annotated assignment to the appropriate category list
        for assignment in assignments:
            assignment_data = AssignmentListSerializer(assignment).data
            category = assignment.category
            categorized_data[category].append(assignment_data)
        
        # Return the categorized response
        return Response(categorized_data, status=status.HTTP_200_OK)
    

class AssignmentAttemptViewSet(ModelViewSet):
    serializer_class = AssignmentAttemptDetailsSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AssignmentAttempt.objects.filter(teacher=self.request.user)

    def get_serializer_class(self):
        # Optional: return different serializer for detail vs list
        if self.action == 'create' or self.action == 'update':
            return AssignmentAttemptCreateSerializer
        return super().get_serializer_class()

    @action(detail=False, methods=['get'], url_path=r'(?P<assignment_id>\d+)/students/(?P<student_id>\d+)/attempt')
    def retrieve_by_assignment_and_student(self, request, assignment_id=None, student_id=None):
        attempt = get_object_or_404(
            AssignmentAttempt,
            assignment_id=assignment_id,
            student_id=student_id
        )
        serializer = self.get_serializer(attempt)
        return Response(serializer.data)
    

