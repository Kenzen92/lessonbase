from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from apps.subjects.models import Subject
from apps.subjects.serializers import SubjectSerializer


@api_view(['GET', 'POST'])    
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def subjects(request):
    user = request.user.get_real_instance()
    if request.method == 'POST':
        subjects_ids = request.data.get('subjects', [])
        try:    
            # If subjects array is empty, remove all subjects from the user
            if not subjects_ids:
                user.subjects.clear()
                return Response({'message': 'All subjects removed from the user'}, status=status.HTTP_200_OK)
            
            # Filter subjects to retain only those present in the request data
            valid_subjects = Subject.objects.filter(id__in=subjects_ids)
            
            # Remove subjects not present in the request data
            user.subjects.remove(*user.subjects.exclude(id__in=valid_subjects.values_list('id', flat=True)))
            
            # Add subjects not already connected to the user
            user.subjects.add(*valid_subjects.exclude(id__in=user.subjects.values_list('id', flat=True)))
            
            return Response({'message': 'User subjects updated successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    else:
        user = user.get_real_instance()
        subjects = user.subjects.all()
        serializer = SubjectSerializer(instance=subjects, many=True)  # Use 'instance' instead of 'data'
        return Response(serializer.data)
    

@api_view(['GET'])    
@permission_classes([AllowAny])
def all_subjects(request):
    subjects = Subject.objects.all()
    serializer = SubjectSerializer(instance=subjects, many=True)  # Use 'instance' instead of 'data'
    return Response(serializer.data)