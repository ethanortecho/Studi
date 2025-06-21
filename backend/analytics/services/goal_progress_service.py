from datetime import date, timedelta

from django.db import transaction

from ..models import WeeklyGoal, DailyGoal
from .goal_service import get_monday


class GoalProgressService:
    """Handles updating weekly & daily goals when study sessions finish."""

    @staticmethod
    @transaction.atomic
    def update_for_session(session):
        """Update goal progress based on a completed study session.

        Args:
            session (StudySession): The completed or active StudySession instance.
        """
        if not session.total_duration or session.total_duration <= 0:
            return  # nothing to add

        study_minutes = session.total_duration // 60  # floor minutes
        if study_minutes == 0:
            return

        user = session.user
        session_date = session.start_time.date()
        week_start = get_monday(session_date)

        try:
            weekly_goal: WeeklyGoal = WeeklyGoal.objects.select_for_update().get(
                user=user,
                week_start=week_start,
            )
        except WeeklyGoal.DoesNotExist:
            return  # No goal set for this week

        # --- Update weekly accumulated ---
        weekly_goal.accumulated_minutes += study_minutes

        # --- Update daily goal if this date is part of the plan ---
        daily_goal: DailyGoal | None = weekly_goal.daily_goals.filter(date=session_date).select_for_update().first()

        if daily_goal:
            prev_acc = daily_goal.accumulated_minutes
            prev_surplus = max(0, prev_acc - daily_goal.target_minutes)

            # increment
            daily_goal.accumulated_minutes = prev_acc + study_minutes

            new_surplus = max(0, daily_goal.accumulated_minutes - daily_goal.target_minutes)
            delta_surplus = new_surplus - prev_surplus

            # Update status
            if daily_goal.accumulated_minutes < daily_goal.target_minutes:
                daily_goal.status = 'pending'
            elif new_surplus == 0:
                daily_goal.status = 'met'
            else:
                daily_goal.status = 'exceeded'

            # Update weekly overtime bank (if enabled) only for *new* surplus minutes
            if delta_surplus > 0 and weekly_goal.carry_over_enabled:
                weekly_goal.overtime_bank += delta_surplus

            daily_goal.save()
        else:
            # Studied on a non-active day → counts toward weekly total only.
            pass

        weekly_goal.save() 