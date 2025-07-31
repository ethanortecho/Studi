from datetime import date, timedelta
from django.utils import timezone


def get_week_boundaries(target_date):
    """
    Returns the Monday and Sunday dates for the week containing the given date (Mon→Sun)
    Args:
        target_date: date object
    Returns:
        tuple: (monday_date, sunday_date)
    """
    if isinstance(target_date, str):
        target_date = date.fromisoformat(target_date)
    
    # In Python's weekday(): Monday=0, Tuesday=1, ..., Sunday=6
    # We want the week to start on Monday and end on Sunday
    
    # Get the Monday of this week
    monday_offset = target_date.weekday()  # 0 for Monday, 1 for Tuesday, ..., 6 for Sunday
    monday = target_date - timedelta(days=monday_offset)
    
    # Sunday is 6 days after Monday
    sunday = monday + timedelta(days=6)

    return monday, sunday


def get_month_boundaries(target_date):
    """
    Returns the first and last dates of the month containing the given date
    Args:
        target_date: date object
    Returns:
        tuple: (month_start, month_end)
    """
    if isinstance(target_date, str):
        target_date = date.fromisoformat(target_date)
    
    # First day of the month
    month_start = target_date.replace(day=1)
    
    # Last day of the month
    if target_date.month == 12:
        next_month = target_date.replace(year=target_date.year + 1, month=1, day=1)
    else:
        next_month = target_date.replace(month=target_date.month + 1, day=1)
    month_end = next_month - timedelta(days=1)
    
    return month_start, month_end


def is_current_period(target_date, timeframe):
    """
    Check if the given date represents the current period for the timeframe
    Args:
        target_date: date object
        timeframe: 'daily', 'weekly', or 'monthly'
    Returns:
        bool: True if this is the current period
    """
    today = timezone.now().date()
    
    if timeframe == 'daily':
        return target_date == today
    elif timeframe == 'weekly':
        current_week_start, _ = get_week_boundaries(today)
        target_week_start, _ = get_week_boundaries(target_date)
        return current_week_start == target_week_start
    elif timeframe == 'monthly':
        current_month_start, _ = get_month_boundaries(today)
        target_month_start, _ = get_month_boundaries(target_date)
        return current_month_start == target_month_start
    
    return False 