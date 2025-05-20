from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import StudySession, CategoryBlock
from ..serializers import StudySessionSerializer, CategoryBlockSerializer, AggregateSerializer


class CreateStudySession(APIView):
    #is passed a start time and optional status
    def post(self, request):
        serializer = StudySessionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            session = serializer.save()
            return Response({"id": session.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class EndStudySession(APIView):
    def put(self, request, id):
        try:
            session = StudySession.objects.get(id=id, user=request.user)
            serializer = StudySessionSerializer(instance=session, data=request.data, partial=True)
            
            if serializer.is_valid():
                updated_session = serializer.complete_session(instance=session, validated_data=serializer.validated_data)
                return Response(StudySessionSerializer(updated_session).data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except StudySession.DoesNotExist:
            return Response({"error": "Study session not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



            
        
        
class CreateCategoryBlock(APIView):
    def post(self, request):
        serializer = CategoryBlockSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            category_block = serializer.save()
            return Response({"id": category_block.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EndCategoryBlock(APIView):
    def put(self, request, id):

        try:
            category_block = CategoryBlock.objects.get(id=id, user=request.user)
            serializer = CategoryBlockSerializer(instance=category_block, data=request.data, partial=True)

            if serializer.is_valid():
                updated_category_block = serializer.complete_category_block(instance=category_block, validated_data=serializer.validated_data)
                return Response(CategoryBlockSerializer(updated_category_block).data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except CategoryBlock.DoesNotExist:
            return Response({"error": "category block not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CreateSubject(APIView):
    def post(self, request):
        user = request.user
        # TODO: Implement subject creation
        return Response({"message": "Not yet implemented"}, status=status.HTTP_501_NOT_IMPLEMENTED)





