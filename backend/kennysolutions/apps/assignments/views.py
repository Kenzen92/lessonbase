from django.shortcuts import get_object_or_404
from apps.user_accounts.models import Teacher
from rest_framework.decorators import action
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from apps.assignments.models import Assignment, AssignmentAttempt, Feedback
from rest_framework import viewsets, status
from django.utils import timezone
from django.db.models import  Q, CharField, Case, When, Value

from apps.assignments.serialisers import AssignmentAttemptCreateSerializer, AssignmentAttemptDetailsSerializer, AssignmentAttemptListSerializer, AssignmentCreateSerializer, AssignmentDetailsSerializer, AssignmentListSerializer, FeedbackSerializer


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing homework assignments.
    """
    serializer_class = AssignmentDetailsSerializer
    queryset = Assignment.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return AssignmentCreateSerializer
        if self.action == 'list':
            return AssignmentListSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        user = self.request.user
        return (
            Assignment.objects.filter(Q(teachers=user) | Q(students=user))
            .distinct()
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

        return Response(status=status.HTTP_201_CREATED)

    def list(self, request):
        now = timezone.now().date()
        assignments = self.get_queryset().annotate(
            category=Case(
                When(Q(marked=True), then=Value('Complete')),
                When(Q(marked=False) & Q(set_date__gt=now), then=Value('Upcoming')),
                When(Q(marked=False) & Q(to_mark=False), then=Value('Set')),
                When(Q(marked=False) & Q(to_mark=True), then=Value('To Mark')),
                default=Value('Uncategorized'),
                output_field=CharField(),
            )
        ).order_by('due_date')

        # Serialize assignments by category
        categorized_data = {
            "To Mark": [],
            "Set": [],
            "Upcoming": [],
            "Complete": [],
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
        return AssignmentAttempt.objects.filter(assignment__teachers=self.request.user)

    def get_serializer_class(self):
        # Optional: return different serializer for detail vs list
        if self.action == 'create' or self.action == 'update':
            return AssignmentAttemptCreateSerializer
        if self.action == "list":
            return AssignmentAttemptListSerializer
        return super().get_serializer_class()
    
    def post(self, request):
        # validate that the user is a student
        user = self.request.user.get_real_instance()
        data = request.data.copy()
        data['submitted_files'] = request.FILES.getlist('files')
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Submission successful"}, status=status.HTTP_201_CREATED)
        else:
            print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=False, methods=['get'], url_path=r'(?P<assignment_id>\d+)/students/(?P<student_id>\d+)/attempt')
    def retrieve_by_assignment_and_student(self, request, assignment_id=None, student_id=None):
        attempt = get_object_or_404(
            AssignmentAttempt,
            assignment_id=assignment_id,
            student_id=student_id
        )
        serializer = self.get_serializer(attempt)
        return Response(serializer.data)
    
class FeedbackViewSet(ModelViewSet):
    serializer_class = FeedbackSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    """
    Feedback is almost always queried in relation to a specific assignment which must be passed as a query param

    Getting an error where the current user is always an anonymous user
    """
    def get_queryset(self):
        user = self.request.user.get_real_instance()
        return Feedback.objects.filter(Q(teacher=user) | Q(student=user))

    def list(self, request):
        # Attempt to get assignment attempt ID from the query params
        assignment_attempt_id = request.GET.get('assignment_attempt_id')

        try:
            assignmentAttempt = AssignmentAttempt.objects.get(id=assignment_attempt_id)
        except AssignmentAttempt.DoesNotExist:
            return Response({'error': 'Assigment attempt does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        user = request.user.get_real_instance()
        if isinstance(user, Teacher):
            feedbacks = Feedback.objects.filter(teacher=user, assignmentAttempt=assignmentAttempt)
        else:
            feedbacks = Feedback.objects.filter(student=user, assignmentAttempt=assignmentAttempt)

        serializer = self.serializer_class(feedbacks, many=True)
        return Response(serializer.data)