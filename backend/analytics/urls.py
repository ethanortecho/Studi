from django.urls import path
from .views import DailyInsights, WeeklyInsights, MonthlyInsights

urlpatterns = [
    path('insights/daily/', DailyInsights.as_view(), name='daily-insights'),
    path('insights/weekly/', WeeklyInsights.as_view(), name='weekly-insights'),
    path('insights/monthly/', MonthlyInsights.as_view(), name='monthly-insights'),
] 