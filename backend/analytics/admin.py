from django.contrib import admin
from .models import CustomUser, StudySession, Categories, StudySessionBreakdown, Aggregate
from django.utils.timezone import localtime

@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'formatted_start_time', 'formatted_end_time', 'total_duration', 'productivity_rating')
    list_filter = ('productivity_rating', 'start_time')
    search_fields = ('user__username',)
    ordering = ('-start_time',)  # Most recent first

    def formatted_start_time(self, obj):
        return localtime(obj.start_time).strftime("%b %d, %Y, %I:%M %p")
    formatted_start_time.short_description = 'Start Time'

    def formatted_end_time(self, obj):
        return localtime(obj.end_time).strftime("%b %d, %Y, %I:%M %p")
    formatted_end_time.short_description = 'End Time'

@admin.register(Categories)
class CategoriesAdmin(admin.ModelAdmin):
    list_display = ('name', 'user')
    list_filter = ('user',)
    search_fields = ('name', 'user__username')

@admin.register(StudySessionBreakdown)
class StudySessionBreakdownAdmin(admin.ModelAdmin):
    list_display = ('study_session', 'category', 'formatted_start_time', 'formatted_end_time', 'duration')
    list_filter = ('category', 'study_session__user')
    search_fields = ('category__name', 'study_session__user__username')

    def formatted_start_time(self, obj):
        return localtime(obj.start_time).strftime("%b %d, %Y, %I:%M %p")
    formatted_start_time.short_description = 'Start Time'

    def formatted_end_time(self, obj):
        return localtime(obj.end_time).strftime("%b %d, %Y, %I:%M %p")
    formatted_end_time.short_description = 'End Time'

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'date_joined')
    search_fields = ('username', 'email')

@admin.register(Aggregate)
class AggregateAdmin(admin.ModelAdmin):
    list_display = ('user', 'time_frame', 'start_date', 'end_date', 'total_duration', 'session_count', 'break_count')
    list_filter = ('time_frame', 'user')
    search_fields = ('user__username',)
