from django.urls import path
from .views.insights_api import DailyInsights, WeeklyInsights, MonthlyInsights
from .views.create_api import CreateStudySession, EndStudySession, CreateSubject, CreateStudySessionBreakdown, EndStudySessionBreakdown

urlpatterns = [
    path('insights/daily/', DailyInsights.as_view(), name='daily-insights'),
    path('insights/weekly/', WeeklyInsights.as_view(), name='weekly-insights'),
    path('insights/monthly/', MonthlyInsights.as_view(), name='monthly-insights'),
    path('create-session/', CreateStudySession.as_view(), name='create-session'),
    path('end-session/<int:id>/', EndStudySession.as_view(), name='end-session'),
    path('create-subject/', CreateSubject.as_view(), name='create-subject'),
    path('create-breakdown/', CreateStudySessionBreakdown.as_view(), name='create-breakdown'),
    path('end-breakdown/<int:id>/', EndStudySessionBreakdown.as_view(), name='end-breakdown')
] 