"""
Premium API Tests

Focus: Testing premium status update endpoint
Scope: Authentication, validation, database updates

Key Testing Areas:
1. Premium status update success scenarios
2. Authentication and permission checks
3. Input validation and error handling
4. Database state consistency
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from analytics.models import CustomUser
import json


class PremiumStatusAPITest(TestCase):
    def setUp(self):
        """Set up test client and user"""
        self.client = APIClient()

        # Create test user
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            is_premium=False
        )

        # Generate JWT token for authentication
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)

        # Set up authenticated client
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

        # API endpoint URL
        self.url = reverse('update-premium-status')

    def test_successful_premium_status_update_to_true(self):
        """Test successful premium status update to True"""
        data = {'is_premium': True}

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check response content
        response_data = response.json()
        self.assertEqual(response_data['message'], 'Premium status updated successfully')
        self.assertEqual(response_data['is_premium'], True)

        # Check database was updated
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_premium)

    def test_successful_premium_status_update_to_false(self):
        """Test successful premium status update to False"""
        # Set user as premium first
        self.user.is_premium = True
        self.user.save()

        data = {'is_premium': False}

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check response content
        response_data = response.json()
        self.assertEqual(response_data['message'], 'Premium status updated successfully')
        self.assertEqual(response_data['is_premium'], False)

        # Check database was updated
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_premium)

    def test_missing_is_premium_field(self):
        """Test request with missing is_premium field"""
        data = {}  # Empty data

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response_data = response.json()
        self.assertEqual(response_data['error'], 'is_premium field is required')

        # Database should not be changed
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_premium)

    def test_invalid_is_premium_value_string(self):
        """Test request with invalid is_premium value (string)"""
        data = {'is_premium': 'true'}  # String instead of boolean

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response_data = response.json()
        self.assertEqual(response_data['error'], 'is_premium must be a boolean value')

    def test_invalid_is_premium_value_null(self):
        """Test request with null is_premium value"""
        data = {'is_premium': None}

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response_data = response.json()
        self.assertEqual(response_data['error'], 'is_premium field is required')

    def test_unauthenticated_request(self):
        """Test request without authentication"""
        # Remove authentication credentials
        self.client.credentials()

        data = {'is_premium': True}

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_request(self):
        """Test request with invalid authentication token"""
        # Set invalid token
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token_here')

        data = {'is_premium': True}

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_method_not_allowed(self):
        """Test that GET requests are not allowed"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_put_method_not_allowed(self):
        """Test that PUT requests are not allowed"""
        data = {'is_premium': True}

        response = self.client.put(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_multiple_status_updates(self):
        """Test multiple consecutive status updates"""
        # Update to premium
        data = {'is_premium': True}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.is_premium)

        # Update back to free
        data = {'is_premium': False}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertFalse(self.user.is_premium)

        # Update to premium again
        data = {'is_premium': True}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.is_premium)

    def test_concurrent_user_updates(self):
        """Test that updates only affect the authenticated user"""
        # Create second user
        user2 = CustomUser.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123',
            is_premium=False
        )

        # Update first user to premium
        data = {'is_premium': True}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that only first user was updated
        self.user.refresh_from_db()
        user2.refresh_from_db()

        self.assertTrue(self.user.is_premium)
        self.assertFalse(user2.is_premium)  # Should remain unchanged

    def test_database_consistency_after_update(self):
        """Test database remains consistent after status updates"""
        initial_user_count = CustomUser.objects.count()

        # Update premium status
        data = {'is_premium': True}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check user count remains the same
        final_user_count = CustomUser.objects.count()
        self.assertEqual(initial_user_count, final_user_count)

        # Check only is_premium field was updated
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_premium)
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@example.com')

    def test_response_format(self):
        """Test response format matches expected structure"""
        data = {'is_premium': True}

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = response.json()

        # Check required fields are present
        self.assertIn('message', response_data)
        self.assertIn('is_premium', response_data)

        # Check field types
        self.assertIsInstance(response_data['message'], str)
        self.assertIsInstance(response_data['is_premium'], bool)

        # Check field values
        self.assertEqual(response_data['is_premium'], True)

    def test_large_payload_handling(self):
        """Test handling of request with extra fields"""
        data = {
            'is_premium': True,
            'extra_field': 'should_be_ignored',
            'another_field': 123,
            'nested_object': {'key': 'value'}
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Only is_premium should be processed
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_premium)


class PremiumUserProfileTest(TestCase):
    """Test that user profile endpoints return premium status"""

    def setUp(self):
        self.client = APIClient()

        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            is_premium=True
        )

        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_profile_includes_premium_status(self):
        """Test that user profile endpoint includes is_premium field"""
        url = reverse('auth-profile')

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = response.json()

        # Check that is_premium is included in response
        self.assertIn('is_premium', response_data)
        self.assertEqual(response_data['is_premium'], True)

        # Update user to free
        self.user.is_premium = False
        self.user.save()

        response = self.client.get(url)
        response_data = response.json()

        self.assertEqual(response_data['is_premium'], False)