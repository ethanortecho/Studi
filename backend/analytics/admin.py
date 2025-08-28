from django.contrib import admin
from .models import CustomUser, StudySession, Categories, CategoryBlock, UserGoals, DailyAggregate, WeeklyAggregate, MonthlyAggregate, WeeklyGoal, DailyGoal
from django.utils.timezone import localtime

@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'formatted_start_time', 'formatted_end_time', 'total_duration', 'status', 'focus_rating', 'flow_score')
    list_filter = ('status', 'focus_rating', 'start_time')
    search_fields = ('user__username',)
    ordering = ('-start_time',)  # Most recent first
    readonly_fields = ('flow_components',)  # Make flow_components read-only since it's JSON
    
    # Add fieldsets for better organization
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'status', 'start_time', 'end_time', 'total_duration')
        }),
        ('Ratings & Scores', {
            'fields': ('focus_rating', 'flow_score', 'flow_components'),
            'description': 'Flow score is calculated automatically based on session metrics. Set to null for sessions < 15 minutes.'
        }),
    )

    def formatted_start_time(self, obj):
        return localtime(obj.start_time).strftime("%b %d, %Y, %I:%M %p")
    formatted_start_time.short_description = 'Start Time'

    def formatted_end_time(self, obj):
        if obj.end_time:
            return localtime(obj.end_time).strftime("%b %d, %Y, %I:%M %p")
        return "Ongoing"
    formatted_end_time.short_description = 'End Time'

@admin.register(Categories)
class CategoriesAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'color', 'is_active', 'is_system', 'category_type')
    list_filter = ('is_active', 'is_system', 'category_type', 'user')
    search_fields = ('name', 'user__username')

@admin.register(CategoryBlock)
class CategoryBlockAdmin(admin.ModelAdmin):
    list_display = ('study_session', 'category', 'formatted_start_time', 'formatted_end_time', 'duration')
    list_filter = ('category', 'study_session__user', 'study_session__status')
    search_fields = ('category__name', 'study_session__user__username')

    def formatted_start_time(self, obj):
        return localtime(obj.start_time).strftime("%b %d, %Y, %I:%M %p")
    formatted_start_time.short_description = 'Start Time'

    def formatted_end_time(self, obj):
        if obj.end_time:
            return localtime(obj.end_time).strftime("%b %d, %Y, %I:%M %p")
        return "Ongoing"
    formatted_end_time.short_description = 'End Time'

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'date_joined')
    search_fields = ('username', 'email')

@admin.register(UserGoals)
class UserGoalsAdmin(admin.ModelAdmin):
    list_display = ('user', 'targeted_minutes', 'date', 'carried_over_minutes', 'carry_over')

@admin.register(DailyAggregate)
class DailyAggregateAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'total_duration', 'session_count', 'break_count', 'flow_score', 'is_final')
    list_filter = ('date', 'user', 'is_final')
    search_fields = ('user__username',)
    ordering = ('-date',)
    readonly_fields = ('flow_score_details',)

    def total_duration_hours(self, obj):
        return f"{obj.total_duration / 3600:.2f}h"
    total_duration_hours.short_description = 'Duration (hours)'

@admin.register(WeeklyAggregate)
class WeeklyAggregateAdmin(admin.ModelAdmin):
    list_display = ('user', 'week_start', 'total_duration', 'session_count', 'break_count', 'flow_score', 'is_final')
    list_filter = ('week_start', 'user', 'is_final')
    search_fields = ('user__username',)
    ordering = ('-week_start',)
    readonly_fields = ('flow_score_details',)

    def total_duration_hours(self, obj):
        return f"{obj.total_duration / 3600:.2f}h"
    total_duration_hours.short_description = 'Duration (hours)'

@admin.register(MonthlyAggregate)
class MonthlyAggregateAdmin(admin.ModelAdmin):
    list_display = ('user', 'month_start', 'total_duration', 'session_count', 'break_count', 'flow_score', 'is_final')
    list_filter = ('month_start', 'user', 'is_final')
    search_fields = ('user__username',)
    ordering = ('-month_start',)
    readonly_fields = ('flow_score_details',)

    def total_duration_hours(self, obj):
        return f"{obj.total_duration / 3600:.2f}h"
    total_duration_hours.short_description = 'Duration (hours)'

@admin.register(WeeklyGoal)
class WeeklyGoalAdmin(admin.ModelAdmin):
    list_display = ('user', 'week_start', 'total_minutes', 'active_weekdays_display', 'carry_over_enabled')
    list_filter = ('week_start', 'user', 'carry_over_enabled')
    search_fields = ('user__username',)
    ordering = ('-week_start',)

    def active_weekdays_display(self, obj):
        if obj.active_weekdays:
            day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            return ', '.join([day_names[i] for i in obj.active_weekdays])
        return 'All days'
    active_weekdays_display.short_description = 'Active Days'

@admin.register(DailyGoal)
class DailyGoalAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'target_minutes', 'accumulated_minutes', 'status')
    list_filter = ('date', 'status', 'weekly_goal__user')
    search_fields = ('weekly_goal__user__username',)
    ordering = ('-date',)

    def user(self, obj):
        return obj.weekly_goal.user.username
    user.short_description = 'User'

