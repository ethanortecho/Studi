from django.urls import path
from .views.insights_api import DailyInsights, WeeklyInsights, MonthlyInsights
from .views.create_api import CreateStudySession, EndStudySession, CreateSubject, CreateCategoryBlock, EndCategoryBlock, CancelStudySession, CleanupHangingSessions
from .views.category_api import CategoryList, CategoryDetail, BreakCategory
from .views.goal_api import WeeklyGoalView

urlpatterns = [
    path('insights/daily/', DailyInsights.as_view(), name='daily-insights'),
    path('insights/weekly/', WeeklyInsights.as_view(), name='weekly-insights'),
    path('insights/monthly/', MonthlyInsights.as_view(), name='monthly-insights'),
    path('create-session/', CreateStudySession.as_view(), name='create-session'),
    path('end-session/<int:id>/', EndStudySession.as_view(), name='end-session'),
    path('create-subject/', CreateSubject.as_view(), name='create-subject'),
    path('create-category-block/', CreateCategoryBlock.as_view(), name='create-category-block'),
    path('end-category-block/<int:id>/', EndCategoryBlock.as_view(), name='end-category-block'),
    path('category-list/', CategoryList.as_view(), name='category-list'),
    path('categories/<int:pk>/', CategoryDetail.as_view(), name='category-detail'),
    path('break-category/', BreakCategory.as_view(), name='break-category'),
    path('cancel-session/<int:id>/', CancelStudySession.as_view(), name='cancel-session'),
    path('goals/weekly/', WeeklyGoalView.as_view(), name='weekly-goal'),
    path('cleanup-hanging-sessions/', CleanupHangingSessions.as_view(), name='cleanup-hanging-sessions'),
] 