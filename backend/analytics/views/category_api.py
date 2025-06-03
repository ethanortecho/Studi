from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import Categories
from django.contrib.auth.models import AbstractUser
from .insights_api import get_target_user
from ..serializers import CategorySerializer

# Predefined color palette
ALLOWED_COLORS = ['#5A4FCF', '#4F9DDE', '#F3C44B', '#F46D75', '#2EC4B6']

class CategoryList(APIView):
    def get(self, request):
        user = get_target_user(request)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Only return active categories
        categories = Categories.objects.filter(user=user, is_active=True)
        category_data = []
        
        for category in categories:
            category_data.append({
                'id': category.id,
                'name': category.name,
                'color': category.color
            })
            
        return Response(category_data, status=status.HTTP_200_OK)

    def post(self, request):
        user = get_target_user(request)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user already has 5 active categories
        active_count = Categories.objects.filter(user=user, is_active=True).count()
        if active_count >= 5:
            return Response({'error': 'Maximum of 5 categories allowed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate color is from allowed palette
        color = request.data.get('color', '')
        if color.upper() not in ALLOWED_COLORS:
            return Response({'error': 'Color must be one of the predefined options'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for duplicate name among active categories
        name = request.data.get('name', '').strip()
        if Categories.objects.filter(user=user, name__iexact=name, is_active=True).exists():
            return Response({'error': 'Category name already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for duplicate color among active categories
        if Categories.objects.filter(user=user, color__iexact=color, is_active=True).exists():
            return Response({'error': 'Color already in use'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            category = serializer.save(user=user)
            return Response({
                'id': category.id,
                'name': category.name,
                'color': category.color
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryDetail(APIView):
    def get_object(self, pk, user):
        try:
            return Categories.objects.get(pk=pk, user=user)
        except Categories.DoesNotExist:
            return None

    def put(self, request, pk):
        user = get_target_user(request)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        category = self.get_object(pk, user)
        if not category:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Validate color is from allowed palette
        color = request.data.get('color', '')
        if color and color.upper() not in ALLOWED_COLORS:
            return Response({'error': 'Color must be one of the predefined options'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for duplicate name among active categories (excluding current category)
        name = request.data.get('name', '').strip()
        if name and Categories.objects.filter(user=user, name__iexact=name, is_active=True).exclude(pk=pk).exists():
            return Response({'error': 'Category name already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for duplicate color among active categories (excluding current category)
        if color and Categories.objects.filter(user=user, color__iexact=color, is_active=True).exclude(pk=pk).exists():
            return Response({'error': 'Color already in use'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CategorySerializer(category, data=request.data, context={'request': request})
        if serializer.is_valid():
            category = serializer.save()
            return Response({
                'id': category.id,
                'name': category.name,
                'color': category.color
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = get_target_user(request)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        category = self.get_object(pk, user)
        if not category:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        
        category.is_active = False
        category.save()
        return Response({'message': 'Category deleted successfully'}, status=status.HTTP_204_NO_CONTENT)