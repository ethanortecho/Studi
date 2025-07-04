from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import timedelta


class CustomUser(AbstractUser):
    # Add related_name attributes to avoid reverse accessor clashes
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_groups',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

class StudySessionManager(models.Manager):
    def active_sessions(self):
        """Get only active and completed sessions, excluding cancelled ones"""
        return self.filter(status__in=['active', 'completed'])

class StudySession(models.Model):
    TIMER_TYPE_CHOICES = [
        ("pomodoro", "Pomodoro"),
        ("custom", "Custom")
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("paused", "Paused"),
        ("interrupted", "Interrupted")
    ]
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    total_duration = models.IntegerField(null=True, blank=True)  # Duration in seconds
    productivity_rating = models.CharField(null=True, blank=True, max_length=50)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="active")

    objects = StudySessionManager()

    class Meta:
        ordering = ['-start_time']

    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            duration = self.end_time - self.start_time
            self.total_duration = int(duration.total_seconds())
        super().save(*args, **kwargs)


class Categories(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=7, default="#000000")
    is_active = models.BooleanField(default=True)
    is_system = models.BooleanField(default=False)
    category_type = models.CharField(max_length=20, default='study')


class UserGoals(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    targeted_minutes = models.IntegerField()
    date = models.DateField()
    carried_over_minutes = models.IntegerField(default=0)
    carry_over = models.BooleanField(default=False)


class CategoryBlock(models.Model):
    #granular breakdown of the study session, including the start and end time of each task
    study_session = models.ForeignKey(StudySession, on_delete=models.CASCADE)
    category = models.ForeignKey(Categories, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            duration = self.end_time - self.start_time
            self.duration = int(duration.total_seconds())
        super().save(*args, **kwargs)


class Aggregate(models.Model):
    TIMEFRAME_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    total_duration = models.IntegerField(default=0)  # Store duration in seconds
    category_durations = models.JSONField(default=dict)  # Store durations in seconds
    session_count = models.IntegerField(default=0)
    break_count = models.IntegerField(default=0)
    time_frame = models.CharField(max_length=10, choices=TIMEFRAME_CHOICES)
    is_final = models.BooleanField(default=False)  # True when period is complete
    last_updated = models.DateTimeField(auto_now=True)  # Track when last updated


class Break(models.Model):
    study_session = models.ForeignKey('StudySession', on_delete = models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration = models.IntegerField(null=True, blank=True)  # Duration in seconds

    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            duration = self.end_time - self.start_time
            self.duration = int(duration.total_seconds())
        super().save(*args, **kwargs)


class WeeklyGoal(models.Model):
    """A user-defined weekly study target."""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    # Monday date that identifies the ISO week
    week_start = models.DateField()
    total_minutes = models.IntegerField()
    # List of active weekdays (0=Mon … 6=Sun) the goal is split across
    active_weekdays = models.JSONField(default=list)
    carry_over_enabled = models.BooleanField(default=False)

    # Tracking fields – updated automatically as sessions complete
    accumulated_minutes = models.IntegerField(default=0)
    overtime_bank = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "week_start")
        ordering = ["-week_start"]

    def __str__(self):
        return f"{self.user.username} – week of {self.week_start}"


class DailyGoal(models.Model):
    """Derived per-day targets tied to a WeeklyGoal."""
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("met", "Met"),
        ("exceeded", "Exceeded"),
    ]

    weekly_goal = models.ForeignKey(WeeklyGoal, on_delete=models.CASCADE, related_name="daily_goals")
    date = models.DateField()
    target_minutes = models.IntegerField()

    accumulated_minutes = models.IntegerField(default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")

    class Meta:
        unique_together = ("weekly_goal", "date")
        ordering = ["date"]

    def __str__(self):
        return f"{self.weekly_goal.user.username} – {self.date} ({self.accumulated_minutes}/{self.target_minutes})"

