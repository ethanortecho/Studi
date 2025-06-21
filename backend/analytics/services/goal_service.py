from datetime import date, timedelta
from typing import List

from django.db import transaction
from django.utils import timezone

from ..models import WeeklyGoal, DailyGoal, CustomUser


def get_monday(dt: date) -> date:
    """Return the Monday of the ISO week that contains *dt*."""
    return dt - timedelta(days=dt.weekday())


class GoalService:
    """Service layer for creating and managing study goals."""

    @staticmethod
    @transaction.atomic
    def create_or_update_weekly_goal(
        *,
        user: CustomUser,
        week_start: date | None = None,
        total_minutes: int,
        active_weekdays: List[int] | None = None,
        carry_over_enabled: bool = False,
    ) -> WeeklyGoal:
        """Create or overwrite a weekly goal and its daily splits.

        Args:
            user: The user.
            week_start: Monday date representing the ISO week.  If None, defaults to current week.
            total_minutes: Weekly target in minutes.
            active_weekdays: List of weekday indices (0=Mon … 6=Sun).  If None, defaults to all 7 days.
            carry_over_enabled: Whether overtime minutes can carry forward.
        """
        if week_start is None:
            week_start = get_monday(timezone.now().date())

        if active_weekdays is None or len(active_weekdays) == 0:
            active_weekdays = list(range(7))  # all days

        active_weekdays = sorted(set(active_weekdays))
        active_day_count = len(active_weekdays)
        if active_day_count == 0:
            raise ValueError("active_weekdays must contain at least one day index (0–6)")

        # Upsert WeeklyGoal
        weekly_goal, _created = WeeklyGoal.objects.update_or_create(
            user=user,
            week_start=week_start,
            defaults={
                "total_minutes": total_minutes,
                "active_weekdays": active_weekdays,
                "carry_over_enabled": carry_over_enabled,
                # reset dynamic fields when updating
                "accumulated_minutes": 0,
                "overtime_bank": 0,
            },
        )

        # Rebuild DailyGoals for that week
        # Remove any existing rows (simpler than diffing)
        weekly_goal.daily_goals.all().delete()

        base_target = total_minutes // active_day_count
        remainder = total_minutes % active_day_count

        # Distribute remainder to earliest active days
        goals_to_create: List[DailyGoal] = []
        for idx, weekday in enumerate(active_weekdays):
            extra = 1 if idx < remainder else 0
            target = base_target + extra
            day_date = week_start + timedelta(days=weekday)
            goals_to_create.append(
                DailyGoal(
                    weekly_goal=weekly_goal,
                    date=day_date,
                    target_minutes=target,
                )
            )

        DailyGoal.objects.bulk_create(goals_to_create)

        return weekly_goal 