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

from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
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


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that allows login with email instead of username.
    
    Converts email to username behind the scenes for Django authentication.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove username requirement and add email field
        self.fields.pop('username', None)
        self.fields['email'] = serializers.EmailField()
    
    def validate(self, attrs):
        # Get email and password from request
        email = attrs.get('email')
        password = attrs.get('password')
        
        print(f"🔍 Serializer validating: email={email}, password={'*' * len(password) if password else None}")
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required')
        
        # Look up user by email to get username
        try:
            user = CustomUser.objects.get(email=email.lower())
            username = user.username
            print(f"🔍 Found user: {username} (ID: {user.id})")
        except CustomUser.DoesNotExist:
            print(f"🔍 User not found for email: {email}")
            raise serializers.ValidationError('Invalid email or password')
        
        # Replace email with username for Django's authentication
        attrs['username'] = username
        attrs.pop('email', None)
        
        print(f"🔍 Final attrs being passed to parent: {attrs}")
        print(f"🔍 Calling parent validation with username: {username}")
        
        # Create a fresh copy to avoid any mutation issues
        clean_attrs = {
            'username': username,
            'password': password
        }
        print(f"🔍 Clean attrs: {clean_attrs}")
        
        # Use parent validation with clean data
        try:
            result = super().validate(clean_attrs)
            print(f"🔍 Parent validation successful")
            return result
        except Exception as e:
            print(f"🔍 Parent validation failed: {e}")
            raise


@api_view(['POST'])
@permission_classes([AllowAny])
def custom_token_obtain_pair(request):
    """
    Simple email-based login endpoint.
    Converts email to username and uses standard JWT authentication.
    """
    # Get email and password from request
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'error': 'Email and password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Look up user by email
    try:
        user = CustomUser.objects.get(email=email.lower())
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'Invalid email or password'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Use Django's standard authentication
    from django.contrib.auth import authenticate
    authenticated_user = authenticate(username=user.username, password=password)
    
    if not authenticated_user:
        return Response(
            {'error': 'Invalid email or password'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Generate JWT tokens manually
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(authenticated_user)
    access_token = refresh.access_token
    
    # Return tokens and user data
    return Response({
        'refresh': str(refresh),
        'access': str(access_token),
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'timezone': user.timezone,
            'is_premium': user.is_premium,
        }
    }, status=status.HTTP_200_OK)


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
        'is_premium': user.is_premium,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_premium_status(request):
    """
    Update User Premium Status

    Updates the authenticated user's premium status after successful IAP purchase.
    This endpoint is called by the mobile app after in-app purchase completion.

    Request Body:
    {
        "is_premium": true
    }

    Response:
    {
        "message": "Premium status updated successfully",
        "is_premium": true
    }
    """

    try:
        is_premium = request.data.get('is_premium')

        # Validate input
        if is_premium is None:
            return Response(
                {'error': 'is_premium field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(is_premium, bool):
            return Response(
                {'error': 'is_premium must be a boolean value'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update user's premium status
        user = request.user
        user.is_premium = is_premium
        user.save(update_fields=['is_premium'])

        return Response({
            'message': 'Premium status updated successfully',
            'is_premium': user.is_premium
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Failed to update premium status: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )