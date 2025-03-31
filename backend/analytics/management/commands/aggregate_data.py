from django.core.management.base import BaseCommand
from django.utils import timezone
from analytics.models import StudySession, Aggregate, StudySessionBreakdown
from datetime import timedelta
from collections import defaultdict

class Command(BaseCommand):
    help = 'Aggregates study session data into daily, weekly, and monthly aggregates'

    def handle(self, *args, **kwargs):
        # Get all unique dates from study sessions
        dates = StudySession.objects.dates('start_time', 'day')
        
        for date in dates:
            # Get all sessions for this date
            sessions = StudySession.objects.filter(start_time__date=date)
            
            if not sessions.exists():
                continue
                
            # Calculate total duration by summing seconds
            total_duration = sum(session.total_duration or 0 for session in sessions)
            
            # Calculate category durations
            category_durations = defaultdict(int)
            for session in sessions:
                breakdowns = session.studysessionbreakdown_set.all()
                for breakdown in breakdowns:
                    category_durations[breakdown.category.name] += breakdown.duration or 0
            
            # Create or update daily aggregate
            daily_aggregate, created = Aggregate.objects.get_or_create(
                user=sessions.first().user,
                start_date=date,
                end_date=date,
                time_frame='daily',
                defaults={
                    'total_duration': total_duration,
                    'category_durations': dict(category_durations),
                    'session_count': sessions.count()
                }
            )
            
            if not created:
                daily_aggregate.total_duration = total_duration
                daily_aggregate.category_durations = dict(category_durations)
                daily_aggregate.session_count = sessions.count()
                daily_aggregate.save()
            
            self.stdout.write(f"Created/Updated daily aggregate for {date}")
            
            # Create weekly aggregate
            week_start = date - timedelta(days=date.weekday())
            week_end = week_start + timedelta(days=6)
            
            weekly_sessions = StudySession.objects.filter(
                start_time__date__gte=week_start,
                start_time__date__lte=week_end
            )
            
            if weekly_sessions.exists():
                weekly_total = sum(session.total_duration or 0 for session in weekly_sessions)
                weekly_categories = defaultdict(int)
                
                for session in weekly_sessions:
                    breakdowns = session.studysessionbreakdown_set.all()
                    for breakdown in breakdowns:
                        weekly_categories[breakdown.category.name] += breakdown.duration or 0
                
                weekly_aggregate, created = Aggregate.objects.get_or_create(
                    user=sessions.first().user,
                    start_date=week_start,
                    end_date=week_end,
                    time_frame='weekly',
                    defaults={
                        'total_duration': weekly_total,
                        'category_durations': dict(weekly_categories),
                        'session_count': weekly_sessions.count()
                    }
                )
                
                if not created:
                    weekly_aggregate.total_duration = weekly_total
                    weekly_aggregate.category_durations = dict(weekly_categories)
                    weekly_aggregate.session_count = weekly_sessions.count()
                    weekly_aggregate.save()
                
                self.stdout.write(f"Created/Updated weekly aggregate for week starting {week_start}")
            
            # Create monthly aggregate
            month_start = date.replace(day=1)
            if date.month == 12:
                month_end = date.replace(day=31)
            else:
                month_end = (date.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            monthly_sessions = StudySession.objects.filter(
                start_time__date__gte=month_start,
                start_time__date__lte=month_end
            )
            
            if monthly_sessions.exists():
                monthly_total = sum(session.total_duration or 0 for session in monthly_sessions)
                monthly_categories = defaultdict(int)
                
                for session in monthly_sessions:
                    breakdowns = session.studysessionbreakdown_set.all()
                    for breakdown in breakdowns:
                        monthly_categories[breakdown.category.name] += breakdown.duration or 0
                
                monthly_aggregate, created = Aggregate.objects.get_or_create(
                    user=sessions.first().user,
                    start_date=month_start,
                    end_date=month_end,
                    time_frame='monthly',
                    defaults={
                        'total_duration': monthly_total,
                        'category_durations': dict(monthly_categories),
                        'session_count': monthly_sessions.count()
                    }
                )
                
                if not created:
                    monthly_aggregate.total_duration = monthly_total
                    monthly_aggregate.category_durations = dict(monthly_categories)
                    monthly_aggregate.session_count = monthly_sessions.count()
                    monthly_aggregate.save()
                
                self.stdout.write(f"Created/Updated monthly aggregate for {month_start.strftime('%B %Y')}")
        
        self.stdout.write(self.style.SUCCESS('Successfully aggregated all study session data')) 