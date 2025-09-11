from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
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


class AccountDeletionView(APIView):
    """
    API endpoint for permanent account deletion
    Deletes user account and all associated data for App Store compliance
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        """
        Permanently delete user account and all associated data
        
        This endpoint:
        1. Blacklists all user's JWT tokens
        2. Deletes user account (CASCADE will delete all related data)
        3. Returns success response
        
        All user data including sessions, categories, goals, and aggregates
        will be permanently deleted and cannot be recovered.
        """
        user = request.user
        username = user.username  # Store for logging before deletion
        
        try:
            # Blacklist all existing refresh tokens for this user
            # This prevents any stored tokens from being used after deletion
            try:
                # Get all outstanding tokens for the user and blacklist them
                from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
                outstanding_tokens = OutstandingToken.objects.filter(user=user)
                
                for token in outstanding_tokens:
                    try:
                        RefreshToken(token.token).blacklist()
                    except Exception as token_error:
                        # Continue even if individual token blacklisting fails
                        print(f"⚠️ Could not blacklist token for user {username}: {token_error}")
                        
            except Exception as blacklist_error:
                # Continue with deletion even if token blacklisting fails
                print(f"⚠️ Token blacklisting failed for user {username}: {blacklist_error}")
            
            # Delete the user account
            # Django CASCADE will automatically delete all related data:
            # - StudySession records
            # - CategoryBlock records  
            # - Break records
            # - Categories records
            # - WeeklyGoal/DailyGoal records
            # - DailyAggregate/WeeklyAggregate/MonthlyAggregate records
            user.delete()
            
            print(f"✅ Account successfully deleted for user: {username}")
            
            return Response({
                'message': 'Account successfully deleted',
                'deleted_user': username
            }, status=status.HTTP_200_OK)
            
        except Exception as error:
            print(f"❌ Account deletion failed for user {username}: {error}")
            return Response({
                'error': 'Account deletion failed. Please try again or contact support.',
                'details': str(error)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)