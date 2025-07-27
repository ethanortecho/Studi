"""
Authentication API Views

This file contains all authentication-related endpoints:
- User Registration 
- Login (token generation)
- Logout (token blacklisting)
- Password Reset

Key Concepts:
- JWT tokens replace traditional sessions
- Access tokens are short-lived (15 min)
- Refresh tokens are long-lived (7 days) 
- All endpoints return JSON for mobile app consumption
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
import re

from analytics.models import CustomUser


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login endpoint that returns user data along with tokens.
    
    Extends the default JWT login to include user profile information.
    This saves the frontend from making a separate API call after login.
    """
    
    def post(self, request, *args, **kwargs):
        # Get the default token response
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # If login successful, add user data to response
            email = request.data.get('email')
            user = CustomUser.objects.get(email=email)
            
            # Add user profile to the response (no username exposed)
            response.data['user'] = {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'timezone': user.timezone,
            }
        
        return response


@api_view(['POST'])
@permission_classes([AllowAny])  # Anyone can register
def register_user(request):
    """
    User Registration Endpoint
    
    Creates a new user account with email and password.
    
    Request Body:
    {
        "email": "user@example.com",
        "password": "secure_password",
        "first_name": "John",
        "last_name": "Doe",
        "timezone": "America/New_York"  # Optional
    }
    
    Note: Username is generated internally and hidden from users.
    Users only interact with their email and display name.
    
    Response:
    {
        "message": "User created successfully",
        "user": { user_data },
        "access": "jwt_access_token",
        "refresh": "jwt_refresh_token"
    }
    """
    
    try:
        # Extract data from request
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password')
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        timezone = request.data.get('timezone', 'UTC')
        
        # Validation
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return Response(
                {'error': 'Invalid email format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password strength
        try:
            validate_password(password)
        except ValidationError as e:
            return Response(
                {'error': list(e.messages)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate internal username (users never see this)
        # Use email prefix + user ID for guaranteed uniqueness
        username = f"user_{email.split('@')[0]}_{CustomUser.objects.count() + 1}"
        
        # Create the user
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            timezone=timezone
        )
        
        # Generate JWT tokens for immediate login
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Return success response with tokens (no username exposed)
        return Response({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'timezone': user.timezone,
            },
            'access': str(access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Registration failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Must be logged in
def logout_user(request):
    """
    Logout Endpoint
    
    Blacklists the user's refresh token to prevent further use.
    This is more secure than just deleting tokens on the client.
    
    Request Body:
    {
        "refresh": "jwt_refresh_token"
    }
    
    Response:
    {
        "message": "Successfully logged out"
    }
    """
    
    try:
        # Get refresh token from request
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Blacklist the token (makes it unusable)
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response(
            {'message': 'Successfully logged out'}, 
            status=status.HTTP_200_OK
        )
        
    except TokenError:
        return Response(
            {'error': 'Invalid refresh token'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Logout failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])  # Anyone can request password reset
def request_password_reset(request):
    """
    Password Reset Request Endpoint
    
    Sends a password reset email to the user if the email exists.
    Returns success regardless to prevent email enumeration attacks.
    
    Request Body:
    {
        "email": "user@example.com"
    }
    
    Response:
    {
        "message": "If this email exists, a reset link has been sent"
    }
    """
    
    email = request.data.get('email', '').lower().strip()
    
    if not email:
        return Response(
            {'error': 'Email is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Check if user exists (but don't reveal this information)
        user = CustomUser.objects.filter(email=email).first()
        
        if user:
            # Generate password reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Create reset link (you'll need to implement the frontend route)
            reset_link = f"your-app://reset-password/{uid}/{token}/"
            
            # Send email (configure email settings in production)
            send_mail(
                subject='Password Reset Request',
                message=f'Click this link to reset your password: {reset_link}',
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@yourdomain.com',
                recipient_list=[email],
                fail_silently=True,  # Don't crash if email fails
            )
        
        # Always return success to prevent email enumeration
        return Response(
            {'message': 'If this email exists, a reset link has been sent'}, 
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        # Log the error but don't expose it to the user
        print(f"Password reset error: {str(e)}")
        return Response(
            {'message': 'If this email exists, a reset link has been sent'}, 
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([AllowAny])  # Anyone can reset with valid token
def confirm_password_reset(request):
    """
    Password Reset Confirmation Endpoint
    
    Resets the user's password using the token from email.
    
    Request Body:
    {
        "uid": "base64_encoded_user_id",
        "token": "password_reset_token",
        "new_password": "new_secure_password"
    }
    
    Response:
    {
        "message": "Password reset successfully"
    }
    """
    
    try:
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not all([uid, token, new_password]):
            return Response(
                {'error': 'UID, token, and new password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decode user ID
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = CustomUser.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response(
                {'error': 'Invalid reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify token
        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Invalid or expired reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password
        try:
            validate_password(new_password)
        except ValidationError as e:
            return Response(
                {'error': list(e.messages)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'message': 'Password reset successfully'}, 
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': f'Password reset failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Must be logged in
def get_user_profile(request):
    """
    Get Current User Profile
    
    Returns the authenticated user's profile information.
    This endpoint helps verify that authentication is working.
    
    Response:
    {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "timezone": "America/New_York"
    }
    """
    
    user = request.user
    return Response({
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'timezone': user.timezone,
    }, status=status.HTTP_200_OK)