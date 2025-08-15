from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict

from ..models import StudySession, CategoryBlock, Break
from ..models import DailyAggregate, WeeklyAggregate, MonthlyAggregate
from .date_utils import get_week_boundaries, get_month_boundaries, is_current_period
from .goal_progress_service import GoalProgressService


class SplitAggregateUpdateService:
    """
    Service for updating split aggregate models in real-time
    """
    
    @staticmethod
    def update_for_session(session):
        """
        Update all aggregates for a session change (real-time)
        
        Args:
            session: StudySession instance
        """
        try:
            import pytz
            
            user = session.user
            
            # Convert session start time to user's timezone to get correct local date
            user_timezone_str = getattr(user, 'timezone', 'UTC')
            try:
                user_tz = pytz.timezone(user_timezone_str)
            except pytz.exceptions.UnknownTimeZoneError:
                user_tz = pytz.UTC
                print(f"⚠️ Invalid timezone '{user_timezone_str}' for user {user.username}, falling back to UTC")
            
            # Convert UTC session start time to user's local date
            session_local_time = session.start_time.astimezone(user_tz)
            session_date = session_local_time.date()
            
            print(f"Updating all aggregates for session {session.id} on {session_date} (user timezone: {user_timezone_str})")
            
            # Update daily aggregate
            SplitAggregateUpdateService._update_daily_aggregate(user, session_date)
            
            # Update weekly aggregate
            week_start, week_end = get_week_boundaries(session_date)
            SplitAggregateUpdateService._update_weekly_aggregate(user, week_start, week_end)
            
            # Update monthly aggregate
            month_start, month_end = get_month_boundaries(session_date)
            SplitAggregateUpdateService._update_monthly_aggregate(user, month_start, month_end)
            
            # Update goal progress
            try:
                GoalProgressService.update_for_session(session)
                print(f"Updated goal progress for session {session.id}")
            except Exception as e:
                print(f"Failed to update goal progress: {str(e)}")
            
            print(f"Successfully updated all aggregates for session {session.id}")
            
        except Exception as e:
            print(f"Error updating aggregates for session {session.id}: {str(e)}")
            raise
    
    @staticmethod
    def _update_daily_aggregate(user, date):
        """Update or create daily aggregate for a specific date"""
        print(f"Updating daily aggregate for {user.username} on {date}")
        
        # Calculate fresh aggregate data for this day
        aggregate_data = SplitAggregateUpdateService._calculate_daily_aggregate_data(user, date)
        
        # Determine if this period is final (not current day)
        is_final = not is_current_period(date, 'daily')
        
        # Update or create daily aggregate
        daily_aggregate, created = DailyAggregate.objects.update_or_create(
            user=user,
            date=date,
            defaults={
                'total_duration': aggregate_data['total_duration'],
                'category_durations': aggregate_data['category_durations'],
                'session_count': aggregate_data['session_count'],
                'break_count': aggregate_data['break_count'],
                'timeline_data': aggregate_data['timeline_data'],
                'productivity_score': aggregate_data.get('productivity_score'),
                'productivity_sessions_count': aggregate_data.get('productivity_sessions_count', 0),
                'is_final': is_final
            }
        )
        
        action = "Created" if created else "Updated"
        print(f"{action} daily aggregate: {aggregate_data['session_count']} sessions, {aggregate_data['total_duration']} seconds")
    
    @staticmethod
    def _calculate_daily_aggregate_data(user, target_date):
        """
        Calculate complete daily aggregate data including timeline
        Uses 3-day buffer query + Python filtering to avoid timezone boundary bugs
        """
        from django.utils import timezone as django_timezone
        import pytz
        from datetime import datetime, time, timedelta
        
        # Get user's timezone
        user_timezone_str = getattr(user, 'timezone', 'UTC')
        try:
            user_tz = pytz.timezone(user_timezone_str)
        except pytz.exceptions.UnknownTimeZoneError:
            user_tz = pytz.UTC
            print(f"⚠️ Invalid timezone '{user_timezone_str}' for user {user.username}, falling back to UTC")
        
        # Query a generous 3-day window to capture any timezone edge cases
        buffer_start = target_date - timedelta(days=1)  # Yesterday
        buffer_end = target_date + timedelta(days=1)    # Tomorrow  
        
        print(f"🕒 Filtering sessions for {user.username} on {target_date} ({user_timezone_str})")
        print(f"   Querying buffer: {buffer_start} to {buffer_end} (UTC dates)")
        
        # Simple UTC date query - no complex timezone boundary math
        candidate_sessions = StudySession.objects.filter(
            user=user,
            start_time__date__gte=buffer_start,
            start_time__date__lte=buffer_end,
            status='completed',
            end_time__isnull=False  # Defensive: exclude any hanging sessions
        ).prefetch_related('categoryblock_set__category', 'break_set')
        
        # Filter in Python with reliable timezone conversion
        sessions = []
        for session in candidate_sessions:
            session_local_date = session.start_time.astimezone(user_tz).date()
            if session_local_date == target_date:
                sessions.append(session)
        
        print(f"   Found {candidate_sessions.count()} candidates, {len(sessions)} match target date")
        
        if not sessions:
            return {
                'total_duration': 0,
                'category_durations': {},
                'session_count': 0,
                'break_count': 0,
                'timeline_data': [],
                'productivity_score': None,
                'productivity_sessions_count': 0
            }
        
        # Filter sessions with valid durations  
        valid_sessions = [s for s in sessions if s.total_duration and s.total_duration > 0]
        
        # Calculate basic metrics (already in seconds)
        total_duration = sum(s.total_duration for s in valid_sessions)
        session_count = len(valid_sessions)
        
        # Calculate break count
        break_count = Break.objects.filter(
            study_session__in=valid_sessions
        ).count()
        
        # Calculate category durations (already in seconds)
        category_durations = defaultdict(int)
        for session in valid_sessions:
            for block in session.categoryblock_set.all():
                if block.duration and block.duration > 0:
                    category_durations[block.category.name] += block.duration
        
        # Calculate weighted productivity score
        total_weighted_score = 0
        total_rated_duration = 0
        sessions_with_ratings = 0
        
        for session in valid_sessions:
            if session.productivity_rating:
                try:
                    # Convert rating string to integer (1-5)
                    rating = int(session.productivity_rating)
                    # Convert to percentage: 1=20%, 2=40%, 3=60%, 4=80%, 5=100%
                    score = rating * 20
                    # Weight by session duration
                    total_weighted_score += score * session.total_duration
                    total_rated_duration += session.total_duration
                    sessions_with_ratings += 1
                except (ValueError, TypeError):
                    # Skip sessions with invalid ratings
                    print(f"Invalid productivity rating for session {session.id}: {session.productivity_rating}")
                    continue
        
        # Calculate final productivity score (weighted average)
        productivity_score = None
        if total_rated_duration > 0:
            productivity_score = total_weighted_score / total_rated_duration
        
        # Build timeline data for API
        timeline_data = []
        for session in valid_sessions:
            session_data = {
                'session_id': session.id,
                'start_time': session.start_time.isoformat(),
                'end_time': session.end_time.isoformat() if session.end_time else None,
                'total_duration': session.total_duration,
                'breaks': [
                    {
                        'start_time': br.start_time.isoformat(),
                        'end_time': br.end_time.isoformat(),
                        'duration': br.duration
                    }
                    for br in session.break_set.all()
                ],
                'category_blocks': [
                    {
                        'category': block.category.name,
                        'start_time': block.start_time.isoformat(),
                        'end_time': block.end_time.isoformat() if block.end_time else None,
                        'duration': block.duration
                    }
                    for block in session.categoryblock_set.all()
                ]
            }
            timeline_data.append(session_data)
        
        return {
            'total_duration': total_duration,
            'category_durations': dict(category_durations),
            'session_count': session_count,
            'break_count': break_count,
            'timeline_data': timeline_data,
            'productivity_score': productivity_score,
            'productivity_sessions_count': sessions_with_ratings
        }
    
    @staticmethod
    def update_weekly_aggregates_for_date(date):
        """
        Update weekly aggregate for the week containing the given date
        Called by scheduled tasks
        """
        week_start, week_end = get_week_boundaries(date)
        
        # Get all users who have daily aggregates in this week
        users = DailyAggregate.objects.filter(
            date__gte=week_start,
            date__lte=week_end
        ).values_list('user', flat=True).distinct()
        
        for user_id in users:
            from ..models import CustomUser
            user = CustomUser.objects.get(id=user_id)
            SplitAggregateUpdateService._update_weekly_aggregate(user, week_start, week_end)
    
    @staticmethod
    def _update_weekly_aggregate(user, week_start, week_end):
        """Update weekly aggregate by summing daily aggregates"""
        print(f"Updating weekly aggregate for {user.username} from {week_start} to {week_end}")
        
        # Get all daily aggregates for this week
        daily_aggregates = DailyAggregate.objects.filter(
            user=user,
            date__gte=week_start,
            date__lte=week_end
        ).order_by('date')
        
        if not daily_aggregates.exists():
            print(f"No daily aggregates found for week {week_start}")
            return
        
        # Sum up daily data
        total_duration = sum(d.total_duration for d in daily_aggregates)
        session_count = sum(d.session_count for d in daily_aggregates)
        break_count = sum(d.break_count for d in daily_aggregates)
        
        # Aggregate category durations
        category_durations = defaultdict(int)
        for daily in daily_aggregates:
            for category, duration in daily.category_durations.items():
                category_durations[category] += duration
        
        # Build daily breakdown - ensure all weekdays are included
        daily_breakdown = {}
        
        # Initialize all weekdays with zero values
        all_weekdays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
        for day_code in all_weekdays:
            daily_breakdown[day_code] = {
                'total': 0,
                'categories': {}
            }
        
        # Fill in actual data for days that have aggregates
        for daily in daily_aggregates:
            day_code = daily.date.strftime('%A')[:2].upper()
            daily_breakdown[day_code] = {
                'total': daily.total_duration,
                'categories': daily.category_durations
            }
        
        # Build session times from daily timeline data - filter out hanging sessions
        session_times = []
        for daily in daily_aggregates:
            for session_data in daily.timeline_data:
                # Only include sessions with valid end_time
                if session_data.get('end_time') is not None:
                    session_times.append({
                        'start_time': session_data['start_time'],
                        'end_time': session_data['end_time'],
                        'total_duration': session_data['total_duration']
                    })
        
        # Determine if week is final
        is_final = not is_current_period(week_start, 'weekly')
        
        # Update weekly aggregate
        weekly_aggregate, created = WeeklyAggregate.objects.update_or_create(
            user=user,
            week_start=week_start,
            defaults={
                'total_duration': total_duration,
                'category_durations': dict(category_durations),
                'session_count': session_count,
                'break_count': break_count,
                'daily_breakdown': daily_breakdown,
                'session_times': session_times,
                'is_final': is_final
            }
        )
        
        action = "Created" if created else "Updated"
        print(f"{action} weekly aggregate: {session_count} sessions, {total_duration} seconds")
    
    @staticmethod
    def update_monthly_aggregates_for_date(date):
        """
        Update monthly aggregate for the month containing the given date
        Called by scheduled tasks
        """
        month_start, month_end = get_month_boundaries(date)
        
        # Get all users who have daily aggregates in this month
        users = DailyAggregate.objects.filter(
            date__gte=month_start,
            date__lte=month_end
        ).values_list('user', flat=True).distinct()
        
        for user_id in users:
            from ..models import CustomUser
            user = CustomUser.objects.get(id=user_id)
            SplitAggregateUpdateService._update_monthly_aggregate(user, month_start, month_end)
    
    @staticmethod
    def _update_monthly_aggregate(user, month_start, month_end):
        """Update monthly aggregate by summing daily aggregates"""
        print(f"Updating monthly aggregate for {user.username} from {month_start} to {month_end}")
        
        # Get all daily aggregates for this month
        daily_aggregates = DailyAggregate.objects.filter(
            user=user,
            date__gte=month_start,
            date__lte=month_end
        ).order_by('date')
        
        if not daily_aggregates.exists():
            print(f"No daily aggregates found for month {month_start}")
            return
        
        # Sum up daily data
        total_duration = sum(d.total_duration for d in daily_aggregates)
        session_count = sum(d.session_count for d in daily_aggregates)
        break_count = sum(d.break_count for d in daily_aggregates)
        
        # Aggregate category durations
        category_durations = defaultdict(int)
        for daily in daily_aggregates:
            for category, duration in daily.category_durations.items():
                category_durations[category] += duration
        
        # Build daily breakdown for charts
        daily_breakdown = []
        for daily in daily_aggregates:
            daily_breakdown.append({
                'date': daily.date.isoformat(),
                'total_duration': round(daily.total_duration / 3600, 2),  # Convert to hours
                'category_durations': daily.category_durations
            })
        
        # Build heatmap data (ready for frontend)
        heatmap_data = {}
        current_date = month_start
        while current_date <= month_end:
            date_str = current_date.strftime('%Y-%m-%d')
            heatmap_data[date_str] = 0
            current_date += timedelta(days=1)
        
        # Fill in actual data
        for daily in daily_aggregates:
            date_str = daily.date.strftime('%Y-%m-%d')
            heatmap_data[date_str] = round(daily.total_duration / 3600, 2)
        
        # Determine if month is final
        is_final = not is_current_period(month_start, 'monthly')
        
        # Update monthly aggregate
        monthly_aggregate, created = MonthlyAggregate.objects.update_or_create(
            user=user,
            month_start=month_start,
            defaults={
                'total_duration': total_duration,
                'category_durations': dict(category_durations),
                'session_count': session_count,
                'break_count': break_count,
                'daily_breakdown': daily_breakdown,
                'heatmap_data': heatmap_data,
                'is_final': is_final
            }
        )
        
        action = "Created" if created else "Updated"
        print(f"{action} monthly aggregate: {session_count} sessions, {total_duration} seconds")