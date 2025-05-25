from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import Categories
from django.contrib.auth.models import AbstractUser
from .insights_api import get_target_user
from ..serializers import CategorySerializer

class CategoryList(APIView):
    def get(self, request):
        user = get_target_user(request)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        categories = Categories.objects.filter(user=user)
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
        
        category.delete()
        return Response({'message': 'Category deleted successfully'}, status=status.HTTP_204_NO_CONTENT)