from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import StudySession, Categories
from ..serializers import StudySessionSerializer, StudySessionBreakdownSerializer, AggregateSerializer


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



            
        
        
class CreateStudySessionBreakdown(APIView):
    def post(self, request):
        serializer = StudySessionBreakdownSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            breakdown = serializer.save()
            return Response({"id": breakdown.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EndStudySessionBreakdown(APIView):
    def put(self, request, id):

        try:
            breakdown = StudySessionBreakdown.objects.get(id=id, user=request.user)
            serializer = StudySessionBreakdownSerializer(instance=breakdown, data=request.data, partial=True)

            if serializer.is_valid():
                updated_breakdown = serializer.complete_breakdown(instance=breakdown, validated_data=serializer.validated_data)
                return Response(StudySessionBreakdownSerializer(updated_breakdown).data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except StudySessionBreakdown.DoesNotExist:
            return Response({"error": "breakdown instance not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CreateSubject(APIView):
    def post(self, request):
        user = request.user
        # TODO: Implement subject creation
        return Response({"message": "Not yet implemented"}, status=status.HTTP_501_NOT_IMPLEMENTED)





