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

class StudySession(models.Model):
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
    status   =  models.CharField(max_length=50, choices=STATUS_CHOICES, default="active")


    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            duration = self.end_time - self.start_time
            self.total_duration = int(duration.total_seconds())
        super().save(*args, **kwargs)


class Categories(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=7, default="#000000")

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

