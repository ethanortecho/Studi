from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..serializers import CustomUserSerializer


class UserProfileView(APIView):
    """
    API endpoint for user profile management
    Allows users to view and update their profile including timezone preference
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user's profile"""
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch(self, request):
        """Update current user's profile (partial update)"""
        serializer = CustomUserSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Log timezone update for debugging
            if 'timezone' in request.data:
                print(f"🕒 Updated user {user.username} timezone to: {user.timezone}")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request):
        """Update current user's profile (full update)"""
        serializer = CustomUserSerializer(
            request.user, 
            data=request.data
        )
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Log timezone update for debugging  
            if 'timezone' in request.data:
                print(f"🕒 Updated user {user.username} timezone to: {user.timezone}")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserTimezoneView(APIView):
    """
    Simplified endpoint specifically for timezone updates
    Useful for initial timezone detection/setup
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user's timezone"""
        return Response({
            'timezone': request.user.timezone,
            'username': request.user.username
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Update user's timezone"""
        timezone = request.data.get('timezone')
        
        if not timezone:
            return Response({
                'error': 'timezone field is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use serializer for validation
        serializer = CustomUserSerializer(
            request.user,
            data={'timezone': timezone},
            partial=True
        )
        
        if serializer.is_valid():
            user = serializer.save()
            print(f"🕒 Updated user {user.username} timezone to: {user.timezone}")
            
            return Response({
                'timezone': user.timezone,
                'message': 'Timezone updated successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)