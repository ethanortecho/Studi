from datetime import date
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.utils.dateparse import parse_date
from django.utils import timezone

from ..services.goal_service import GoalService
from ..serializers import WeeklyGoalSerializer
from ..models import WeeklyGoal
from .insights_api import get_target_user


class WeeklyGoalView(APIView):
    """Create, retrieve, or update a user's weekly study goal."""

    def get(self, request):
        """Fetch the weekly goal for the specified week (defaults to current)."""
        user = get_target_user(request)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        week_start_str = request.query_params.get('week_start')
        if week_start_str:
            week_start = parse_date(week_start_str)
            if not week_start:
                return Response({'error': 'Invalid week_start format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            week_start = timezone.now().date()

        # Ensure Monday
        week_start = week_start - timedelta(days=week_start.weekday())

        goal = WeeklyGoal.objects.filter(user=user, week_start=week_start).first()
        if not goal:
            return Response({'message': 'No goal set for this week'}, status=status.HTTP_404_NOT_FOUND)

        return Response(WeeklyGoalSerializer(goal).data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create or overwrite the weekly goal for the given (or current) week."""
        user = request.user

        total_minutes = request.data.get('total_minutes')
        if total_minutes is None:
            return Response({'error': 'total_minutes is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            total_minutes = int(total_minutes)
        except (TypeError, ValueError):
            return Response({'error': 'total_minutes must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        week_start_str = request.data.get('week_start')
        week_start = parse_date(week_start_str) if week_start_str else None
        if week_start_str and not week_start:
            return Response({'error': 'Invalid week_start format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        active_weekdays = request.data.get('active_weekdays')
        if active_weekdays is None:
            active_weekdays = list(range(7))
        # ensure ints
        try:
            active_weekdays = [int(x) for x in active_weekdays]
        except (TypeError, ValueError):
            return Response({'error': 'active_weekdays must be list of ints 0-6'}, status=status.HTTP_400_BAD_REQUEST)

        carry_over_enabled = bool(request.data.get('carry_over_enabled', False))

        try:
            goal = GoalService.create_or_update_weekly_goal(
                user=user,
                week_start=week_start,
                total_minutes=total_minutes,
                active_weekdays=active_weekdays,
                carry_over_enabled=carry_over_enabled,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(WeeklyGoalSerializer(goal).data, status=status.HTTP_201_CREATED)

    def put(self, request, pk):
        """Update an existing weekly goal by ID."""
        try:
            goal = WeeklyGoal.objects.get(id=pk, user=request.user)
        except WeeklyGoal.DoesNotExist:
            return Response({'error': 'Goal not found'}, status=status.HTTP_404_NOT_FOUND)

        # Use same fields as POST but treat missing ones as keep existing
        total_minutes = request.data.get('total_minutes', goal.total_minutes)
        active_weekdays = request.data.get('active_weekdays', goal.active_weekdays)
        carry_over_enabled = request.data.get('carry_over_enabled', goal.carry_over_enabled)

        try:
            total_minutes = int(total_minutes)
            active_weekdays = [int(x) for x in active_weekdays]
        except (TypeError, ValueError):
            return Response({'error': 'Invalid data types'}, status=status.HTTP_400_BAD_REQUEST)

        goal = GoalService.create_or_update_weekly_goal(
            user=request.user,
            week_start=goal.week_start,
            total_minutes=total_minutes,
            active_weekdays=active_weekdays,
            carry_over_enabled=carry_over_enabled,
        )
        return Response(WeeklyGoalSerializer(goal).data, status=status.HTTP_200_OK) 