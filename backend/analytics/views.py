from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta
from django.utils.dateparse import parse_date
from .serializers import StudySessionSerializer, StudySessionBreakdownSerializer, AggregateSerializer
from .queries import StudyAnalytics
from .models import Aggregate, StudySession, StudySessionBreakdown, Categories, CustomUser
from django.utils import timezone
# Create your views here.
    
def get_target_user(request):
    """Get the target user based on request parameters and permissions"""
    requesting_user = request.user
    target_username = request.query_params.get('username')
    
    # If no username specified, use the requesting user
    if not target_username:
        return requesting_user
        
    # If requesting user is admin, allow access to any user
    if requesting_user.is_staff:
        try:
            return CustomUser.objects.get(username=target_username)
        except CustomUser.DoesNotExist:
            return None
            
    # If requesting user is not admin, only allow access to their own data
    if target_username == requesting_user.username:
        return requesting_user
    return None

class DailyInsights(APIView):

    def get(self, request):
        user = get_target_user(request)
        if not user:
            return Response(
                {'error': 'User not found or access denied'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        date_str = request.query_params.get('date')
        
        # Parse the date string into a date object
        try:
            date = parse_date(date_str)
            if not date:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        #get aggregate data for specified date (none will exist for current day)
        daily_aggregate = StudyAnalytics.get_aggregate_data(user, start_date=date, end_date=date, timeframe='daily')

        #retrieve sessions and breakdown for session breakdown bar graph
        daily_sessions = StudyAnalytics.get_daily_sessions_with_breakdown(user, date)
        
        
        # Get timeline data for sessions
        timeline_data = []
        for session in daily_sessions:
            session_data = {
                'start_time': session.start_time,
                'end_time': session.end_time,
                'breaks': session.break_set.all().values('start_time', 'end_time', 'duration'),
                'breakdowns': session.studysessionbreakdown_set.all().values(
                    'category', 
                    'start_time',
                    'end_time', 
                    'duration'
                )
            }
            timeline_data.append(session_data)

        longest_session = StudyAnalytics.get_longest_session(user, date, date)
        
        # Calculate average break duration
        all_breaks = [break_ for session in daily_sessions for break_ in session.break_set.all()]
        avg_break_duration = (
            sum(break_.duration for break_ in all_breaks) / len(all_breaks)
            if all_breaks else 0
        )

        #if daily aggregate is not found (e.g its the current day) manually calculate and return data
        if not daily_aggregate:
            total_duration = sum(session.total_duration for session in daily_sessions)
            session_count = len(daily_sessions)
            
            # Calculate category durations
            category_durations = {}
            for session in daily_sessions:
                # Get breakdowns for this session
                breakdowns = session.studysessionbreakdown_set.all()
                for breakdown in breakdowns:
                    category_name = breakdown.category.name
                    if category_name not in category_durations:
                        category_durations[category_name] = breakdown.duration
                    else:
                        category_durations[category_name] += breakdown.duration
            
            # Create a temporary aggregate object
            daily_aggregate = Aggregate(
                user=user,
                start_date=date,
                end_date=date,
                total_duration=total_duration,
                category_durations=category_durations,
                session_count=session_count,
                time_frame='daily'
            )
        
        response_data = {
            'aggregate': AggregateSerializer(daily_aggregate).data,
            'timeline_data': timeline_data,
            'statistics': {
                'longest_session': longest_session,
                'avg_break_duration': avg_break_duration,
            }
        }

        return Response(response_data, status=status.HTTP_200_OK)
    
    
    
    

class WeeklyInsights(APIView):
    def get(self, request):
        user = get_target_user(request)
        if not user:
            return Response(
                {'error': 'User not found or access denied'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        try:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)
            print(f"Parsed dates - Start: {start_date} ({type(start_date)}), End: {end_date} ({type(end_date)})")
            
            if not start_date or not end_date:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        weekly_aggregate = StudyAnalytics.get_aggregate_data(user, start_date=start_date, end_date=end_date, timeframe='weekly')
        print(f"Weekly Aggregate: {weekly_aggregate}")
        daily_breakdown = StudyAnalytics.get_aggregates_in_range(user, start_date, end_date, timeframe='daily')
        session_times = StudyAnalytics.get_weekly_session_times(user, start_date, end_date)

        # Calculate average session duration in hours
        total_sessions = sum(day.session_count for day in daily_breakdown)
        avg_session_duration = (weekly_aggregate.total_duration.total_seconds() / 3600 / total_sessions) if total_sessions > 0 else 0
        
        # Calculate average break duration in hours
        all_breaks = StudyAnalytics.get_all_breaks_in_range(user, start_date, end_date)
        avg_break_duration = (
            sum(break_.duration.total_seconds() / 3600 for break_ in all_breaks) / len(all_breaks)
            if all_breaks else 0
        )

        # Ensure all days of the week are represented
        days_of_week = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
        complete_daily_breakdown = {day: {'total': 0} for day in days_of_week}

        # Get all daily aggregates in range
        daily_aggregates = StudyAnalytics.get_aggregates_in_range(user, start_date, end_date, timeframe='daily')

        for aggregate in daily_aggregates:
            day_name = aggregate.start_date.strftime('%A')[:2].upper()
            complete_daily_breakdown[day_name] = {
                'total': round(aggregate.total_duration.total_seconds() / 3600, 2),
                'categories': aggregate.category_durations
            }

        # Format session times in hours
        formatted_session_times = []
        for session in session_times:
            formatted_session_times.append({
                'start_time': session['start_time'],
                'end_time': session['end_time'],
                'total_duration': session['total_duration'].total_seconds() / 3600  # Convert to hours
            })

        response_data = {
            'statistics': {
                'total_hours': weekly_aggregate.total_duration.total_seconds() / 3600,  # Convert to hours
                'avg_session_duration': avg_session_duration,  # Already in hours
                'avg_break_duration': avg_break_duration  # Already in hours
            },
            'weekly_aggregate': AggregateSerializer(weekly_aggregate).data,
            'daily_breakdown': complete_daily_breakdown,
            'session_times': formatted_session_times,
        }

        return Response(response_data, status=status.HTTP_200_OK)
    
class MonthlyInsights(APIView):
    def get(self, request):
        user = get_target_user(request)
        if not user:
            return Response(
                {'error': 'User not found or access denied'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        try:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)
            
            if not start_date or not end_date:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get monthly aggregate
        monthly_aggregate = StudyAnalytics.get_aggregate_data(user, start_date, end_date, timeframe='monthly')
        
        # Get all weekly aggregates within this month
        weekly_aggregates = StudyAnalytics.get_aggregates_in_range(user, start_date, end_date, timeframe='weekly')
        
        # Format weekly data
        weekly_breakdown = []
        for aggregate in weekly_aggregates:
            weekly_breakdown.append({
                'start_date': aggregate.start_date,
                'end_date': aggregate.end_date,
                'total_duration': round(aggregate.total_duration.total_seconds() / 3600, 2),
                'category_durations': aggregate.category_durations
            })

        # Calculate average session duration in hours
        total_sessions = monthly_aggregate.session_count
        avg_session_duration = (
            monthly_aggregate.total_duration.total_seconds() / 3600 / total_sessions
        ) if total_sessions > 0 else 0

        response_data = {
            'statistics': {
                'total_hours': monthly_aggregate.total_duration.total_seconds() / 3600,
                'avg_session_duration': avg_session_duration,
                'total_sessions': total_sessions
            },
            'monthly_aggregate': AggregateSerializer(monthly_aggregate).data,
            'weekly_breakdown': weekly_breakdown
        }

        return Response(response_data, status=status.HTTP_200_OK)
    