from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import StudySession, CategoryBlock
from ..serializers import StudySessionSerializer, CategoryBlockSerializer
from rest_framework import serializers
from django.utils import timezone
from ..services.aggregate_service import AggregateUpdateService
from ..services.split_aggregate_service import SplitAggregateUpdateService


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
                
                # End any open category blocks when completing the session
                open_blocks = CategoryBlock.objects.filter(
                    study_session=updated_session,
                    end_time__isnull=True
                )
                for block in open_blocks:
                    block.end_time = updated_session.end_time
                    block.save()
                    print(f"Ended CategoryBlock {block.id} at {block.end_time}")
                
                # Update aggregates immediately after session completion
                try:
                    # Use both services temporarily during transition
                    AggregateUpdateService.update_for_session(updated_session)  # Keep old service
                    SplitAggregateUpdateService.update_for_session(updated_session)  # Add new service
                    print(f"Successfully updated aggregates for session {updated_session.id}")
                except Exception as e:
                    print(f"Failed to update aggregates for session {updated_session.id}: {str(e)}")
                    # Fail fast - if aggregate update fails, the operation should fail
                    return Response({"error": f"Session completed but aggregate update failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                return Response(StudySessionSerializer(updated_session).data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except StudySession.DoesNotExist:
            return Response({"error": "Study session not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CancelStudySession(APIView):
    def put(self, request, id):
        try:
            session = StudySession.objects.get(id=id, user=request.user)
            
            # Mark session as cancelled and set end time
            session.status = "cancelled"
            
            # Use provided end_time if available, otherwise use server time
            if 'end_time' in request.data:
                session.end_time = request.data['end_time']
            else:
                session.end_time = timezone.now()
            
            session.save()
            
            # Also end any open category blocks with the same end time
            open_blocks = CategoryBlock.objects.filter(
                study_session=session,
                end_time__isnull=True
            )
            for block in open_blocks:
                block.end_time = session.end_time
                block.save()
            
            return Response({
                "message": "Session cancelled successfully",
                "session_id": session.id,
                "status": session.status
            }, status=status.HTTP_200_OK)
            
        except StudySession.DoesNotExist:
            return Response({"error": "Study session not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



            
        
        
class CreateCategoryBlock(APIView):
    def post(self, request):
        serializer = CategoryBlockSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            print("Serializer is valid")
            category_block = serializer.save()
            return Response({"id": category_block.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EndCategoryBlock(APIView):
    def put(self, request, id):
        print(f"\nDEBUG EndCategoryBlock:")
        print(f"Request user: {request.user.username} (superuser: {request.user.is_superuser})")
        print(f"Request data: {request.data}")
        print(f"Looking for block ID: {id}")
        
        try:
            if request.user.is_superuser:
                # Admin can access any block
                category_block = CategoryBlock.objects.get(id=id)
                print(f"Found block (admin): {category_block.id}")
            else:
                # Regular users can only access blocks from their sessions
                category_block = CategoryBlock.objects.select_related('study_session').get(
                    id=id,
                    study_session__user=request.user
                )
                print(f"Found block (user): {category_block.id}")

            print(f"Block before update: start_time={category_block.start_time}, end_time={category_block.end_time}")
            
            serializer = CategoryBlockSerializer(
                instance=category_block, 
                data=request.data, 
                context={'request': request},
                partial=True
            )
            
            print(f"Is serializer valid? {serializer.is_valid()}")
            if not serializer.is_valid():
                print(f"Serializer errors: {serializer.errors}")

            if serializer.is_valid():
                updated_category_block = serializer.complete_category_block(
                    instance=category_block, 
                    validated_data=serializer.validated_data
                )
                print(f"Block after update: start_time={updated_category_block.start_time}, end_time={updated_category_block.end_time}")
                return Response(CategoryBlockSerializer(updated_category_block).data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except CategoryBlock.DoesNotExist:
            print(f"Block not found with ID: {id}")
            return Response({"error": "category block not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CreateSubject(APIView):
    def post(self, request):
        user = request.user
        # TODO: Implement subject creation
        return Response({"message": "Not yet implemented"}, status=status.HTTP_501_NOT_IMPLEMENTED)


class CleanupHangingSessions(APIView):
    def post(self, request):
        """
        Cleanup hanging sessions that were never properly ended.
        Detects sessions with null end_time or sessions older than 24 hours.
        """
        try:
            user = request.user
            cleaned_count = 0
            
            # Find hanging sessions for this user
            # Sessions are considered hanging if:
            # 1. end_time is null (never ended) OR status is still 'active'
            # 2. start_time is older than 1 hour ago (more aggressive for crash recovery)
            cutoff_time = timezone.now() - timedelta(hours=1)
            
            hanging_sessions = StudySession.objects.filter(
                user=user,
                start_time__lt=cutoff_time
            ).filter(
                Q(end_time__isnull=True) | Q(status='active')
            )
            
            for session in hanging_sessions:
                # End the session with a reasonable duration (1 hour max)
                # to indicate it was auto-ended due to hanging
                if not session.end_time:
                    session.end_time = session.start_time + timedelta(hours=1)
                if session.status == 'active':
                    session.status = "cancelled"  # Mark as cancelled since it wasn't properly completed
                session.save()
                
                # Also end any open category blocks for this session
                open_blocks = CategoryBlock.objects.filter(
                    study_session=session,
                    end_time__isnull=True
                )
                for block in open_blocks:
                    block.end_time = session.end_time
                    block.save()
                
                cleaned_count += 1
                print(f"Cleaned hanging session {session.id} started at {session.start_time}")
            
            # Also clean up any orphaned category blocks (blocks with null end_time 
            # but belonging to completed sessions)
            orphaned_blocks = CategoryBlock.objects.filter(
                study_session__user=user,
                study_session__status='completed',
                end_time__isnull=True,
                start_time__lt=cutoff_time
            )
            
            orphaned_count = 0
            for block in orphaned_blocks:
                # Set block end_time to session end_time or start_time + 1 hour as fallback
                if block.study_session.end_time:
                    block.end_time = block.study_session.end_time
                else:
                    block.end_time = block.start_time + timedelta(hours=1)
                block.save()
                orphaned_count += 1
                print(f"Cleaned orphaned category block {block.id} in session {block.study_session.id}")
            
            total_cleaned = cleaned_count + orphaned_count
            return Response({
                "message": f"Cleaned up {cleaned_count} hanging session(s) and {orphaned_count} orphaned category block(s)",
                "cleaned_sessions": cleaned_count,
                "cleaned_blocks": orphaned_count,
                "total_cleaned": total_cleaned
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in CleanupHangingSessions: {str(e)}")
            return Response({
                "error": f"Failed to cleanup hanging sessions: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateSessionRating(APIView):
    def put(self, request, id):
        """
        Update the productivity rating for a completed study session.
        Separate endpoint to avoid conflicts with session ending logic.
        """
        try:
            session = StudySession.objects.get(id=id, user=request.user)
            
            # Validate that session is completed
            if session.status != 'completed':
                return Response({
                    "error": "Can only update rating for completed sessions"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate productivity rating
            productivity_rating = request.data.get('productivity_rating')
            if not productivity_rating:
                return Response({
                    "error": "productivity_rating is required"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                rating_value = int(productivity_rating)
                if rating_value < 1 or rating_value > 5:
                    raise ValueError()
            except (ValueError, TypeError):
                return Response({
                    "error": "productivity_rating must be an integer between 1 and 5"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update only the productivity rating
            session.productivity_rating = str(rating_value)
            session.save()
            
            return Response({
                "message": "Session rating updated successfully",
                "session_id": session.id,
                "productivity_rating": session.productivity_rating
            }, status=status.HTTP_200_OK)
            
        except StudySession.DoesNotExist:
            return Response({"error": "Study session not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)





