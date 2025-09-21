from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from analytics.models import Feedback


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_feedback(request):
    """
    Submit user feedback for bug reports, feature requests, etc.

    Expected data:
    {
        "feedback_type": "bug|feature|improvement|general|other",
        "description": "User's feedback text",
        "user_email": "user@example.com",
        "device_info": {
            "platform": "ios|android",
            "app_version": "1.0.0",
            "device_model": "iPhone 15"
        }
    }
    """
    try:
        # Extract and validate required fields
        feedback_type = request.data.get('feedback_type')
        description = request.data.get('description')
        user_email = request.data.get('user_email')
        device_info = request.data.get('device_info', {})

        # Validation
        if not feedback_type:
            return Response({
                'error': 'Feedback type is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not description or description.strip() == '':
            return Response({
                'error': 'Description is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not user_email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate feedback type
        valid_types = [choice[0] for choice in Feedback.FEEDBACK_TYPE_CHOICES]
        if feedback_type not in valid_types:
            return Response({
                'error': f'Invalid feedback type. Must be one of: {", ".join(valid_types)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create feedback entry
        feedback = Feedback.objects.create(
            user=request.user,
            feedback_type=feedback_type,
            description=description.strip(),
            user_email=user_email,
            device_info=device_info if device_info else None
        )

        return Response({
            'message': 'Feedback submitted successfully',
            'feedback_id': feedback.id,
            'type': feedback.get_feedback_type_display()
        }, status=status.HTTP_201_CREATED)

    except ValidationError as e:
        return Response({
            'error': f'Validation error: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': 'An error occurred while submitting feedback'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_feedback_types(request):
    """
    Get available feedback types for the frontend form.
    """
    types = [
        {'value': choice[0], 'label': choice[1]}
        for choice in Feedback.FEEDBACK_TYPE_CHOICES
    ]

    return Response({
        'feedback_types': types
    }, status=status.HTTP_200_OK)