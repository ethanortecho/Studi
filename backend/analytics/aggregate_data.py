from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum, Count
from datetime import timedelta, datetime, date
from analytics.models import StudySession, Aggregate, CategoryBlock, Break
from collections import defaultdict
from analytics.services.date_utils import get_week_boundaries

class Command(BaseCommand):
    help = 'Aggregates existing study session data into daily, weekly, and monthly records'

    def handle(self, *args, **kwargs):
        # Clear existing aggregates
        Aggregate.objects.all().delete()
        
        # Get all unique users with study sessions (excluding cancelled ones)
        users = StudySession.objects.filter(
            status='completed'
        ).values_list('user', flat=True).distinct()
        
        for user_id in users:
            # Get all active sessions for this user
            sessions = StudySession.objects.filter(
                user_id=user_id,
                status='completed'  # Exclude cancelled sessions
            ).order_by('start_time')
            
            if not sessions:
                continue
                
            # Get date range
            first_session = sessions.first()
            last_session = sessions.last()
            current_date = first_session.start_time.date()
            end_date = last_session.end_time.date()
            
            # Create daily aggregates
            while current_date <= end_date:
                # For daily, use same date for start and end
                self.create_aggregate(user_id, current_date, current_date, 'daily')
                current_date += timedelta(days=1)
            
            # Create weekly aggregates aligned to calendar weeks
            current_date = first_session.start_time.date()
            while current_date <= end_date:
                week_start, week_end = get_week_boundaries(current_date)
                self.create_aggregate(user_id, week_start, week_end, 'weekly')
                current_date = week_end + timedelta(days=1)  # Start next week
            
            # Create monthly aggregates
            current_date = first_session.start_time.date().replace(day=1)
            while current_date <= end_date:
                if current_date.month == 12:
                    next_month = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    next_month = current_date.replace(month=current_date.month + 1)
                self.create_aggregate(user_id, current_date, next_month, 'monthly')
                current_date = next_month

    def create_aggregate(self, user_id, start_date, end_date, timeframe):
        # For daily aggregates, only get active sessions from that specific day
        if timeframe == 'daily':
            sessions = StudySession.objects.filter(
                user_id=user_id,
                start_time__date=start_date,  # Only get sessions that started on this exact date
                status='completed'  # Exclude cancelled sessions
            )
        else:
            # For weekly/monthly, keep the range query but exclude cancelled
            sessions = StudySession.objects.filter(
                user_id=user_id,
                start_time__date__gte=start_date,
                end_time__date__lte=end_date,
                status='completed'  # Exclude cancelled sessions
            )
        
        print(f"Creating {timeframe} aggregate for {start_date} to {end_date}")
        print(f"Found sessions: {sessions.count()}")
        for session in sessions:
            print(f"  {session.start_time.date()}: {session.total_duration}")
        
        if not sessions.exists():
            return
            
        # Calculate basic metrics in seconds
        total_duration = sessions.aggregate(total=Sum('total_duration'))['total'] or timedelta()
        total_duration_seconds = int(total_duration.total_seconds())
        session_count = sessions.count()
        
        # Calculate break count (only from active sessions)
        break_count = Break.objects.filter(
            study_session__in=sessions,
            study_session__status='completed'
        ).count()
        
        # Calculate category durations in seconds (only from active sessions)
        category_durations = defaultdict(timedelta)
        breakdowns = CategoryBlock.objects.filter(
            study_session__in=sessions,
            study_session__status='completed'
        )
        
        for breakdown in breakdowns:
            category_durations[breakdown.category.name] += breakdown.duration
        
        # Store durations in seconds
        category_durations_json = {
            cat: int(duration.total_seconds())
            for cat, duration in category_durations.items()
        }
        
        # Create aggregate record with durations in seconds
        Aggregate.objects.create(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            time_frame=timeframe,
            total_duration=total_duration_seconds,  # Store as seconds
            session_count=session_count,
            break_count=break_count,
            category_durations=category_durations_json  # Store as seconds
        )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Created {timeframe} aggregate for {start_date} to {end_date}'
            )
        ) 