from datetime import date, timedelta
from django.utils import timezone


def get_week_boundaries(target_date):
    """
    Returns the Sunday and Saturday dates for the week containing the given date (Sun→Sat)
    Args:
        target_date: date object
    Returns:
        tuple: (sunday_date, saturday_date)
    """
    if isinstance(target_date, str):
        target_date = date.fromisoformat(target_date)
    
    # In Python's weekday(): Monday=0 … Sunday=6.
    # We want the week to start on Sunday.  For any target_date, move backwards to the
    # most recent Sunday, then forward 6 days to get Saturday.

    # Offset (0-6) from the given date back to the previous Sunday.  If the date is already
    # Sunday (weekday()==6) the offset is 0.
    sunday_offset = (target_date.weekday() + 1) % 7  # Monday→1, … Sunday→0
    sunday = target_date - timedelta(days=sunday_offset)
    saturday = sunday + timedelta(days=6)

    return sunday, saturday


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