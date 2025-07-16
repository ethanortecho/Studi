from django.db.models import Sum, Avg, Count
from django.utils import timezone
from datetime import timedelta
from .models import StudySession, CategoryBlock, Categories, Break
from .models import DailyAggregate, WeeklyAggregate, MonthlyAggregate

class StudyAnalytics:

    @staticmethod
    def get_aggregate_data(user, start_date, end_date, timeframe):
        """retrieves an aggregate object for a user within a date range and timeframe"""
        print(f"Getting {timeframe} aggregate for user {user.username} from {start_date} to {end_date}")
        
        if timeframe == 'daily':
            # For daily, start_date and end_date should be the same
            return DailyAggregate.objects.filter(user=user, date=start_date).first()
        elif timeframe == 'weekly':
            return WeeklyAggregate.objects.filter(user=user, week_start=start_date).first()
        elif timeframe == 'monthly':
            return MonthlyAggregate.objects.filter(user=user, month_start=start_date).first()
        else:
            print(f"Unknown timeframe: {timeframe}")
            return None
    
    @staticmethod
    def get_aggregates_in_range(user, start_date, end_date, timeframe):
        """retrieves all aggregate objects for a user within a date range for a specific timeframe"""
        print(f"Getting {timeframe} aggregates for user {user.username} from {start_date} to {end_date}")
        
        if timeframe == 'daily':
            query = DailyAggregate.objects.filter(
                user=user,
                date__gte=start_date,
                date__lte=end_date
            ).order_by('date')
        elif timeframe == 'weekly':
            query = WeeklyAggregate.objects.filter(
                user=user,
                week_start__gte=start_date,
                week_start__lte=end_date
            ).order_by('week_start')
        elif timeframe == 'monthly':
            query = MonthlyAggregate.objects.filter(
                user=user,
                month_start__gte=start_date,
                month_start__lte=end_date
            ).order_by('month_start')
        else:
            print(f"Unknown timeframe: {timeframe}")
            return None
        
        print(f"Found {query.count()} {timeframe} aggregates")
        for agg in query:
            if timeframe == 'daily':
                print(f"  {agg.date}: {agg.total_duration}s")
            elif timeframe == 'weekly':
                print(f"  {agg.week_start}: {agg.total_duration}s")
            elif timeframe == 'monthly':
                print(f"  {agg.month_start}: {agg.total_duration}s")
        
        return query

    @staticmethod
    def get_custom_aggregate(user, start_date, end_date):
        filters = {
            'user': user, 
            'start_date__gte': start_date, 
            'end_date__lte': end_date,
            'status': 'completed'  # Only include completed sessions
        }
        return StudySession.objects.filter(**filters).aggregate(
            total_duration=Sum('total_duration'),
            session_count=Count('id'),
            break_duration=Sum('break__duration')
        )
    
    @staticmethod
    def get_daily_sessions_with_breakdown(user, date):
        return StudySession.objects.filter(
            user=user,
            start_time__date=date,
            status='completed'  # Only include completed sessions
        ).prefetch_related('categoryblock_set').order_by('start_time')
    
    @staticmethod
    def get_weekly_session_times(user, week_start, week_end):
        return StudySession.objects.filter(
            user=user,
            start_time__date__gte=week_start,
            start_time__date__lte=week_end,
            status='completed'  # Only include completed sessions
        ).values('start_time', 'end_time', 'total_duration').order_by('start_time')

    @staticmethod
    def get_longest_session(user, start_date, end_date):
        return StudySession.objects.filter(
            user=user,
            start_time__gte=start_date,
            end_time__lte=end_date,
            status='completed'  # Only include completed sessions
        ).order_by('-total_duration').first()

    @staticmethod
    def get_user_total_study_time(user, start_date=None, end_date=None):
        """Get total study time for a user within an optional date range"""
        # Build the filter conditionally
        filters = {
            'user': user,
            'status': 'completed'  # Only include completed sessions
        }
        if start_date:
            filters['start_time__gte'] = start_date
        if end_date:
            filters['end_time__lte'] = end_date

        # Perform the query and aggregate the total duration
        total_time = StudySession.objects.filter(**filters).aggregate(total_time=Sum('total_duration'))['total_time']

        # Return total_time or zero if no sessions found
        return total_time or 0

    @staticmethod
    def get_longest_study_session(user, start_date=None, end_date=None):
        """Get longest study session from a user within optional date range"""
        filters = {
            'user': user,
            'status': 'completed'  # Only include completed sessions
        }
        if start_date:
            filters['start_time__gte'] = start_date
        if end_date:
            filters['end_time__lte'] = end_date

        query = StudySession.objects.filter(**filters).order_by('-total_duration').first()
        return query if query else None

    @staticmethod
    def get_category_breakdown(user, timeframe='week'):
        """Get study time breakdown by category"""
        now = timezone.now()
        if timeframe == 'week':
            start_date = now - timedelta(days=7)
        elif timeframe == 'month':
            start_date = now - timedelta(days=30)
        else:
            start_date = None

        return CategoryBlock.objects.filter(
            study_session__user=user,
            study_session__status='completed',  # Only include completed sessions
            start_time__gte=start_date
        ).values('category__name').annotate(
            total_duration=Sum('duration'),
            session_count=Count('study_session', distinct=True)
        )

    @staticmethod
    def get_productivity_stats(user):
        """Get average productivity rating and related stats"""
        return StudySession.objects.filter(
            user=user,
            status='completed'  # Only include completed sessions
        ).aggregate(
            avg_productivity=Avg('productivity_rating'),
            total_sessions=Count('id')
        )

    @staticmethod
    def get_recent_sessions(user, limit=5):
        """Get user's most recent study sessions"""
        return StudySession.objects.filter(
            user=user,
            status='completed'  # Only include completed sessions
        ).order_by('-start_time')[:limit]

    @staticmethod
    def get_category_list(user):
        """Get all categories created by user"""
        return Categories.objects.filter(user=user)

    @staticmethod
    def get_all_breaks_in_range(user, start_date, end_date):
        return Break.objects.filter(
            study_session__user=user,
            study_session__status='completed',  # Only include completed sessions
            start_time__date__gte=start_date,
            end_time__date__lte=end_date
        )

    @staticmethod
    def get_active_sessions(user, start_date=None, end_date=None):
        """Get only completed sessions, excluding cancelled ones"""
        filters = {
            'user': user,
            'status': 'completed'  # Only include completed sessions
        }
        if start_date:
            filters['start_time__gte'] = start_date
        if end_date:
            filters['end_time__lte'] = end_date
        
        return StudySession.objects.filter(**filters)

    