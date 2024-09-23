import datetime
from apps.storage.storage_backends import GridFSStorage
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from apps.user_accounts.models import Student, Teacher
from apps.subjects.models import Subject
from apps.classes.serialisers import AssignHomeworkSerializer, ClassEventSerializer, HomeworkSerializer
from django.core.exceptions import ValidationError
from .serialisers import AssignHomeworkSerializer, ClassEventSerializer, HomeworkSerializer, TeachingResourceSerializer
from .models import ClassEvent, Homework, TeachingResource


@api_view(['GET', 'POST', 'DELETE', 'PUT', 'PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def class_events(request, class_id=None):
    if request.method == 'GET':
        user = request.user
        class_events = ClassEvent.objects.filter(students=user) | ClassEvent.objects.filter(teachers=user)
        serializer = ClassEventSerializer(class_events, many=True)
        return Response(serializer.data)

    elif request.method == 'DELETE':
        try:
            class_event = ClassEvent.objects.get(id=class_id)
            class_event.delete()
            return Response({'message': 'Class event deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except ClassEvent.DoesNotExist:
            return Response({'error': 'Class event not found'}, status=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'POST':
        teacher_ids = [request.user.pk]
        student_ids = request.data.get('students', [])

        teachers = Teacher.objects.filter(pk__in=teacher_ids)
        students = Student.objects.filter(pk__in=student_ids)
        serializer = ClassEventSerializer(data=request.data)
        if serializer.is_valid():
            class_event = serializer.save()
            class_event.teachers.set(teachers)
            class_event.students.set(students)
            return Response({"message": "Class event created successfully"}, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method in ['PUT', 'PATCH']:
        if not class_id:
            return Response({"error": "Class event ID is required for updating"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            class_event = ClassEvent.objects.get(id=class_id)
        except ClassEvent.DoesNotExist:
            return Response({"error": "Class event not found"}, status=status.HTTP_404_NOT_FOUND)

        teacher_ids = [request.user.pk]
        student_ids = request.data.get('students', [])

        teachers = Teacher.objects.filter(pk__in=teacher_ids)
        students = Student.objects.filter(pk__in=student_ids)

        # Use partial updates with PATCH, full update with PUT
        partial = request.method == 'PATCH'
        serializer = ClassEventSerializer(class_event, data=request.data, partial=partial)

        if serializer.is_valid():
            class_event = serializer.save()
            class_event.teachers.set(teachers)
            class_event.students.set(students)
            return Response({"message": "Class event updated successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    else:
        return Response({'message': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def teacher_statistics(request):
    teacher = Teacher.objects.get(pk = request.user)    
    try:
        current_dateTime = datetime.datetime.now()
        all_past_classes = ClassEvent.objects.filter(start_time__lt=current_dateTime)
        class_count = all_past_classes.count()
        class_duration_total = sum([each_class.duration for each_class in all_past_classes])
        student_count = teacher.students.count()
        return Response({"data": {"class_count": class_count, "class_duration_total": class_duration_total, "student_count": student_count}}, status=status.HTTP_200_OK)
    except Teacher.DoesNotExist:
        return Response({"error": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)
    


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def class_material(request):
    # Print the incoming request data for debugging
    print(request.data)

    # Ensure class_id is provided
    class_id = request.data.get('class_id')
    if class_id is None:
        return Response({"error": "class_id is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Extract class event from class_id (assuming it's part of TeachingResourceSerializer)
    try:
        class_event = ClassEvent.objects.get(id=class_id)  # Replace with actual model query
    except ClassEvent.DoesNotExist:
        return Response({"error": "Class event not found"}, status=status.HTTP_404_NOT_FOUND)

    # Handle file uploads
    files = request.FILES.getlist('file')  # getlist to handle multiple files
    if not files:
        return Response({"error": "No files provided"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Process each file individually
    for uploaded_file in files:
        # Create a GridFSStorage instance and save the file
        gridfs_storage = GridFSStorage()  # Pass parameters if necessary
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


@api_view(['POST', 'GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def homework(request):
    user = request.user

    if request.method == "GET":
        # Get the homework ID from the query parameters
        homework_id = request.query_params.get('id', None)

        if homework_id:
            try:
                # Retrieve specific homework by ID
                homework_instance = Homework.objects.get(id=homework_id, teachers=user)
                serializer = AssignHomeworkSerializer(homework_instance)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Homework.DoesNotExist:
                return Response({"error": "Homework not found or you do not have access to it."}, status=status.HTTP_404_NOT_FOUND)

        else:
            # Retrieve all homework tasks assigned to the authenticated user
            homework_list = Homework.objects.filter(teachers=user)
            print(homework_list )
            serializer = HomeworkSerializer(homework_list, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
    else:
        serializer = AssignHomeworkSerializer(data=request.data)
        if serializer.is_valid():
            # Save the instance
            homework_instance = serializer.save()

            # Optionally, add the user who is creating the homework to the teachers
            homework_instance.teachers.add(user)
            print(homework_instance )
            return Response({"success": "Homework instance created"}, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        

