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
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    total_duration = models.DurationField(null=True, blank=True)
    productivity_rating = models.CharField(max_length=50)



class Categories(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)



class StudySessionBreakdown(models.Model):
    #granular breakdown of the study session, including the start and end time of each task
    study_session = models.ForeignKey(StudySession, on_delete=models.CASCADE)
    category = models.ForeignKey(Categories, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration = models.DurationField()


class Aggregate(models.Model):
    TIMEFRAME_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    total_duration = models.DurationField(default=timedelta())
    category_durations = models.JSONField(default=dict) 
    session_count = models.IntegerField(default=0)
    break_count = models.IntegerField(default=0)
    time_frame = models.CharField(max_length=10, choices=TIMEFRAME_CHOICES)


class Break(models.Model):
    study_session = models.ForeignKey('StudySession', on_delete = models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration = models.DurationField(null=True, blank=True)

