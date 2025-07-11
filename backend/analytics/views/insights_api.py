from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta
from django.utils.dateparse import parse_date
from ..serializers import StudySessionSerializer, CategoryBlockSerializer, AggregateSerializer
from ..queries import StudyAnalytics
from ..models import Aggregate, StudySession, CategoryBlock, Categories, CustomUser
from django.utils import timezone


# TODO: Move formatting logic into serializer for cleaner separation

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
        user_categories = StudyAnalytics.get_category_list(user)
        category_data = {}

        for category in user_categories:

            category_data[category.id] = {
                "name" : category.name,
                "color" : category.color
        }

            
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
                'breakdowns': session.categoryblock_set.all().values(
                    'category', 
                    'start_time',
                    'end_time', 
                    'duration'
                )
            }
            timeline_data.append(session_data)

        
        #if daily aggregate is not found (e.g its the current day) manually calculate and return data
        if not daily_aggregate:
            total_duration = sum(session.total_duration for session in daily_sessions)
            session_count = len(daily_sessions)
            
            # Calculate category durations
            category_durations = {}
            for session in daily_sessions:
                # Get breakdowns for this session
                breakdowns = session.categoryblock_set.all()
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
            'category_metadata' : category_data,
            
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
        user_categories = StudyAnalytics.get_category_list(user)
        category_data = {}

        for category in user_categories:

            category_data[category.id] = {
                "name" : category.name,
                "color" : category.color
            }
            

            
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
        print(f"Weekly Aggregate Query - Start: {start_date}, End: {end_date}, Timeframe: weekly")
        print(f"Weekly Aggregate Result: {weekly_aggregate}")
        if weekly_aggregate:
            print(f"Found aggregate: {weekly_aggregate.start_date} to {weekly_aggregate.end_date} - {weekly_aggregate.total_duration} seconds")
        else:
            print("No weekly aggregate found - checking what exists in DB")
            from analytics.models import Aggregate
            all_weekly = Aggregate.objects.filter(user=user, time_frame='weekly')
            print(f"All weekly aggregates for user: {[(a.start_date, a.end_date, a.total_duration) for a in all_weekly]}")
        
        daily_breakdown = StudyAnalytics.get_aggregates_in_range(user, start_date, end_date, timeframe='daily')
        session_times = StudyAnalytics.get_weekly_session_times(user, start_date, end_date)

      
       

        # Ensure all days of the week are represented
        days_of_week = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
        complete_daily_breakdown = {day: {'total': 0} for day in days_of_week}

        # Get all daily aggregates in range
        daily_aggregates = StudyAnalytics.get_aggregates_in_range(user, start_date, end_date, timeframe='daily')

        for aggregate in daily_aggregates:
            day_name = aggregate.start_date.strftime('%A')[:2].upper()
            complete_daily_breakdown[day_name] = {
                'total': aggregate.total_duration,
                'categories': aggregate.category_durations
            }

        # Format session times in hours
        formatted_session_times = []
        for session in session_times:
            formatted_session_times.append({
                'start_time': session['start_time'],
                'end_time': session['end_time'],
                'total_duration': session['total_duration']  
            })

        response_data = {
            'aggregate': AggregateSerializer(weekly_aggregate).data,

            
                
            
            
            'category_metadata' : category_data,

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
            
        user_categories = StudyAnalytics.get_category_list(user)
        category_data = {}

        for category in user_categories:
            category_data[category.id] = {
                "name": category.name,
                "color": category.color
            }
            
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
        
        # Get all daily aggregates within this month
        daily_aggregates = StudyAnalytics.get_aggregates_in_range(user, start_date, end_date, timeframe='daily')
        
        # Format daily data for breakdown
        daily_breakdown = []
        for aggregate in daily_aggregates:
            daily_breakdown.append({
                'date': aggregate.start_date,
                'total_duration': round(aggregate.total_duration / 3600, 2),
                'category_durations': aggregate.category_durations
            })

        # Create heatmap data structure (date-value pairs)
        heatmap_data = {}
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            heatmap_data[date_str] = 0
            current_date += timedelta(days=1)
        
        # Fill in actual data
        for aggregate in daily_aggregates:
            date_str = aggregate.start_date.strftime('%Y-%m-%d')
            heatmap_data[date_str] = round(aggregate.total_duration / 3600, 2)

        # Calculate statistics
        total_sessions = monthly_aggregate.session_count if monthly_aggregate else 0
        total_hours = monthly_aggregate.total_duration / 3600 if monthly_aggregate else 0

        response_data = {
            'statistics': {
                'total_hours': total_hours,
                'total_sessions': total_sessions
            },
            'monthly_aggregate': AggregateSerializer(monthly_aggregate).data if monthly_aggregate else None,
            'daily_breakdown': daily_breakdown,
            'heatmap_data': heatmap_data,
            'category_metadata': category_data
        }

        return Response(response_data, status=status.HTTP_200_OK)
    