from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict

from ..models import StudySession, CategoryBlock, Aggregate, Break
from .date_utils import get_week_boundaries, get_month_boundaries, is_current_period


class AggregateUpdateService:
    """
    Service for updating aggregates in real-time when sessions change
    """
    
    @staticmethod
    def update_for_session(session):
        """
        Update all relevant aggregates for a session change
        Args:
            session: StudySession instance
        """
        try:
            user = session.user
            session_date = session.start_time.date()
            
            print(f"Updating aggregates for session {session.id} on {session_date}")
            
            # Update daily aggregate
            AggregateUpdateService._update_daily_aggregate(user, session_date)
            
            # Update weekly aggregate  
            week_start, week_end = get_week_boundaries(session_date)
            AggregateUpdateService._update_weekly_aggregate(user, week_start, week_end)
            
            print(f"Successfully updated all aggregates for session {session.id}")
            
        except Exception as e:
            print(f"Error updating aggregates for session {session.id}: {str(e)}")
            # Re-raise to fail fast (as discussed)
            raise
    
    @staticmethod
    def _update_daily_aggregate(user, date):
        """Update or create daily aggregate for a specific date"""
        print(f"Updating daily aggregate for {user.username} on {date}")
        
        # Calculate fresh aggregate data for this day
        aggregate_data = AggregateUpdateService._calculate_fresh_aggregate(
            user, date, date, 'daily'
        )
        
        # Determine if this period is final (not current day)
        is_final = not is_current_period(date, 'daily')
        
        # Update or create aggregate
        daily_aggregate, created = Aggregate.objects.update_or_create(
            user=user,
            time_frame='daily',
            start_date=date,
            end_date=date,
            defaults={
                'total_duration': aggregate_data['total_duration'],
                'category_durations': aggregate_data['category_durations'],
                'session_count': aggregate_data['session_count'],
                'break_count': aggregate_data['break_count'],
                'is_final': is_final
            }
        )
        
        action = "Created" if created else "Updated"
        print(f"{action} daily aggregate: {aggregate_data['session_count']} sessions, {aggregate_data['total_duration']} seconds")
    
    @staticmethod
    def _update_weekly_aggregate(user, week_start, week_end):
        """Update or create weekly aggregate for a specific week"""
        print(f"Updating weekly aggregate for {user.username} from {week_start} to {week_end}")
        
        # Calculate fresh aggregate data for this week
        aggregate_data = AggregateUpdateService._calculate_fresh_aggregate(
            user, week_start, week_end, 'weekly'
        )
        
        # Determine if this period is final (not current week)
        is_final = not is_current_period(week_start, 'weekly')
        
        # Update or create aggregate
        weekly_aggregate, created = Aggregate.objects.update_or_create(
            user=user,
            time_frame='weekly',
            start_date=week_start,
            end_date=week_end,
            defaults={
                'total_duration': aggregate_data['total_duration'],
                'category_durations': aggregate_data['category_durations'],
                'session_count': aggregate_data['session_count'],
                'break_count': aggregate_data['break_count'],
                'is_final': is_final
            }
        )
        
        action = "Created" if created else "Updated"
        print(f"{action} weekly aggregate: {aggregate_data['session_count']} sessions, {aggregate_data['total_duration']} seconds")
    
    @staticmethod
    def _calculate_fresh_aggregate(user, start_date, end_date, timeframe):
        """
        Calculate fresh aggregate data for a date range
        Returns dict with total_duration, category_durations, session_count, break_count
        """
        # Get all active sessions in the date range (exclude cancelled)
        sessions = StudySession.objects.filter(
            user=user,
            start_time__date__gte=start_date,
            start_time__date__lte=end_date,
            status__in=['completed', 'active']
        )
        
        if not sessions.exists():
            return {
                'total_duration': 0,
                'category_durations': {},
                'session_count': 0,
                'break_count': 0
            }
        
        # Filter out sessions with invalid durations (negative or None)
        valid_sessions = sessions.filter(total_duration__gt=0)
        print(f"Found {sessions.count()} total sessions, {valid_sessions.count()} with valid durations")
        
        # Calculate total duration (sum of all session durations)
        total_duration = valid_sessions.aggregate(total=Sum('total_duration'))['total'] or 0
        session_count = valid_sessions.count()
        
        # Calculate break count (only from valid sessions)
        break_count = Break.objects.filter(
            study_session__in=valid_sessions
        ).count()
        
        # Calculate category durations (only from valid sessions)
        category_durations = defaultdict(int)
        category_blocks = CategoryBlock.objects.filter(
            study_session__in=valid_sessions,
            study_session__status__in=['completed', 'active']
        ).select_related('category')
        
        for block in category_blocks:
            if block.duration and block.duration > 0:  # Only count completed blocks with positive duration
                category_durations[block.category.name] += block.duration
        
        return {
            'total_duration': total_duration,
            'category_durations': dict(category_durations),
            'session_count': session_count,
            'break_count': break_count
        } 