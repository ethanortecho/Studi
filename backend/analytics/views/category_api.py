from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import Categories
from django.contrib.auth.models import AbstractUser
from .insights_api import get_target_user

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