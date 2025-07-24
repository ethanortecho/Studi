from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta
from django.utils.dateparse import parse_date
from ..serializers import StudySessionSerializer, CategoryBlockSerializer
from ..serializers import DailyAggregateSerializer, WeeklyAggregateSerializer, MonthlyAggregateSerializer
from ..queries import StudyAnalytics
from ..models import StudySession, CategoryBlock, Categories, CustomUser
from ..models import DailyAggregate, WeeklyAggregate, MonthlyAggregate
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

        # Try to get daily aggregate from new split model first
        try:
            daily_aggregate = DailyAggregate.objects.get(user=user, date=date)
            print(f"Found DailyAggregate for {date}")
            
            # Use precomputed data from new model
            response_data = {
                'aggregate': {
                    'total_duration': daily_aggregate.total_duration,
                    'category_durations': daily_aggregate.category_durations,
                    'session_count': daily_aggregate.session_count,
                    'break_count': daily_aggregate.break_count,
                    'is_final': daily_aggregate.is_final
                },
                'timeline_data': daily_aggregate.timeline_data,  # Precomputed!
                'category_metadata': category_data,
            }
            
        except DailyAggregate.DoesNotExist:
            print(f"No DailyAggregate found for {date}, falling back to old method")
            
            # Fallback to old method if new aggregate doesn't exist
            daily_aggregate = StudyAnalytics.get_aggregate_data(user, start_date=date, end_date=date, timeframe='daily')
            daily_sessions = StudyAnalytics.get_daily_sessions_with_breakdown(user, date)
            
            # Get timeline data for sessions (old method)
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

            # If daily aggregate is not found, manually calculate and return data
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
                
                # Create a temporary daily aggregate object
                daily_aggregate = DailyAggregate(
                    user=user,
                    date=date,
                    total_duration=total_duration,
                    category_durations=category_durations,
                    session_count=session_count,
                    break_count=0,  # Not calculated in fallback
                    timeline_data=[],  # Not calculated in fallback
                    is_final=False
                )
            
            response_data = {
                'aggregate': DailyAggregateSerializer(daily_aggregate).data,
                'timeline_data': timeline_data,
                'category_metadata': category_data,
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
        
        # Try to get weekly aggregate from new split model first
        try:
            weekly_aggregate = WeeklyAggregate.objects.get(user=user, week_start=start_date)
            print(f"Found WeeklyAggregate for week starting {start_date}")
            
            # Use precomputed data from new model
            response_data = {
                'aggregate': {
                    'total_duration': weekly_aggregate.total_duration,
                    'category_durations': weekly_aggregate.category_durations,
                    'session_count': weekly_aggregate.session_count,
                    'break_count': weekly_aggregate.break_count,
                    'is_final': weekly_aggregate.is_final
                },
                'category_metadata': category_data,
                'daily_breakdown': weekly_aggregate.daily_breakdown,  # Precomputed!
                'session_times': weekly_aggregate.session_times,     # Precomputed!
            }
            
        except WeeklyAggregate.DoesNotExist:
            print(f"No WeeklyAggregate found for week starting {start_date}, falling back to old method")
            
            # Fallback to old method if new aggregate doesn't exist
            weekly_aggregate = StudyAnalytics.get_aggregate_data(user, start_date=start_date, end_date=end_date, timeframe='weekly')
            print(f"Weekly Aggregate Query - Start: {start_date}, End: {end_date}, Timeframe: weekly")
            print(f"Weekly Aggregate Result: {weekly_aggregate}")
            if weekly_aggregate:
                print(f"Found weekly aggregate: {weekly_aggregate.week_start} - {weekly_aggregate.total_duration} seconds")
            else:
                print("No weekly aggregate found - checking what exists in DB")
                all_weekly = WeeklyAggregate.objects.filter(user=user)
                print(f"All weekly aggregates for user: {[(a.week_start, a.total_duration) for a in all_weekly]}")
            
            daily_breakdown = StudyAnalytics.get_aggregates_in_range(user, start_date, end_date, timeframe='daily')
            session_times = StudyAnalytics.get_weekly_session_times(user, start_date, end_date)

            # Ensure all days of the week are represented
            days_of_week = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
            complete_daily_breakdown = {day: {'total': 0} for day in days_of_week}

            # Get all daily aggregates in range
            daily_aggregates = StudyAnalytics.get_aggregates_in_range(user, start_date, end_date, timeframe='daily')

            for aggregate in daily_aggregates:
                day_name = aggregate.date.strftime('%A')[:2].upper()
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
                'aggregate': WeeklyAggregateSerializer(weekly_aggregate).data,
                'category_metadata': category_data,
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
        
        # Try to get monthly aggregate from new split model first
        try:
            monthly_aggregate = MonthlyAggregate.objects.get(user=user, month_start=start_date)
            print(f"Found MonthlyAggregate for month starting {start_date}")
            
            # Use precomputed data from new model
            total_hours = monthly_aggregate.total_duration / 3600 if monthly_aggregate.total_duration else 0
            
            response_data = {
                'statistics': {
                    'total_hours': total_hours,
                    'total_sessions': monthly_aggregate.session_count
                },
                'monthly_aggregate': {
                    'total_duration': monthly_aggregate.total_duration,
                    'category_durations': monthly_aggregate.category_durations,
                    'session_count': monthly_aggregate.session_count,
                    'break_count': monthly_aggregate.break_count,
                    'is_final': monthly_aggregate.is_final
                },
                'daily_breakdown': monthly_aggregate.daily_breakdown,  # Precomputed!
                'heatmap_data': monthly_aggregate.heatmap_data,       # Precomputed!
                'category_metadata': category_data
            }
            
        except MonthlyAggregate.DoesNotExist:
            print(f"No MonthlyAggregate found for month starting {start_date}, falling back to old method")
            
            # Fallback to old method if new aggregate doesn't exist
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
                'monthly_aggregate': MonthlyAggregateSerializer(monthly_aggregate).data if monthly_aggregate else None,
                'daily_breakdown': daily_breakdown,
                'heatmap_data': heatmap_data,
                'category_metadata': category_data
            }

        return Response(response_data, status=status.HTTP_200_OK)
    