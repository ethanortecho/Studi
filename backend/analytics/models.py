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
    
    # User's timezone for aggregation and display
    timezone = models.CharField(
        max_length=50,
        default='UTC',
        help_text='User timezone (e.g., America/New_York, Europe/London)'
    )
    
    # Premium status
    is_premium = models.BooleanField(
        default=False,
        help_text='Whether the user has premium access'
    )

class StudySessionManager(models.Manager):
    def active_sessions(self):
        """Get only completed sessions, excluding active and cancelled ones"""
        return self.filter(status='completed')

class StudySession(models.Model):
    TIMER_TYPE_CHOICES = [
        ("pomodoro", "Pomodoro"),
        ("stopwatch", "Stopwatch"),
        ("countdown", "Countdown"),
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
    focus_rating = models.CharField(null=True, blank=True, max_length=50, help_text="User's self-rated focus level (1-5)")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="active")

    objects = StudySessionManager()

    class Meta:
        ordering = ['-start_time']

    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            duration = self.end_time - self.start_time
            self.total_duration = round(duration.total_seconds())
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
            self.duration = round(duration.total_seconds())
        super().save(*args, **kwargs)


# Split aggregate models
class DailyAggregate(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    date = models.DateField()
    
    # Basic metrics
    total_duration = models.IntegerField(default=0)  # seconds
    session_count = models.IntegerField(default=0)
    break_count = models.IntegerField(default=0)
    
    # Productivity metrics
    productivity_score = models.FloatField(null=True, blank=True)  # 0-100 percentage
    productivity_sessions_count = models.IntegerField(default=0)  # Number of sessions with ratings
    
    # Pre-computed JSON data for API responses
    category_durations = models.JSONField(default=dict)  # {category_name: seconds}
    timeline_data = models.JSONField(default=list)  # Complete session timeline for API
    
    # Metadata
    is_final = models.BooleanField(default=False)  # True when day is complete
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'date')
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'date', 'is_final']),
        ]
        
    def __str__(self):
        return f"{self.user.username} - {self.date}"


class WeeklyAggregate(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    week_start = models.DateField()  # Monday of the week
    
    # Basic metrics
    total_duration = models.IntegerField(default=0)  # seconds
    session_count = models.IntegerField(default=0)
    break_count = models.IntegerField(default=0)
    
    # Pre-computed JSON data for API responses
    category_durations = models.JSONField(default=dict)  # {category_name: seconds}
    daily_breakdown = models.JSONField(default=dict)  # {day_code: {total, categories}}
    session_times = models.JSONField(default=list)  # All session start/end times
    
    # Metadata
    is_final = models.BooleanField(default=False)  # True when week is complete
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'week_start')
        indexes = [
            models.Index(fields=['user', 'week_start']),
        ]
        
    def __str__(self):
        return f"{self.user.username} - week of {self.week_start}"


class MonthlyAggregate(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    month_start = models.DateField()  # First day of month
    
    # Basic metrics
    total_duration = models.IntegerField(default=0)  # seconds
    session_count = models.IntegerField(default=0)
    break_count = models.IntegerField(default=0)
    
    # Pre-computed JSON data for API responses
    category_durations = models.JSONField(default=dict)  # {category_name: seconds}
    daily_breakdown = models.JSONField(default=list)  # [{date, total_duration, categories}]
    heatmap_data = models.JSONField(default=dict)  # {date_str: hours} Ready for heatmap
    
    # Metadata
    is_final = models.BooleanField(default=False)  # True when month is complete
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'month_start')
        indexes = [
            models.Index(fields=['user', 'month_start']),
        ]
        
    def __str__(self):
        return f"{self.user.username} - month of {self.month_start}"


class Break(models.Model):
    study_session = models.ForeignKey('StudySession', on_delete = models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration = models.IntegerField(null=True, blank=True)  # Duration in seconds

    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            duration = self.end_time - self.start_time
            self.duration = round(duration.total_seconds())
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

