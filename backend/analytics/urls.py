from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views.insights_api import DailyInsights, WeeklyInsights, MonthlyInsights
from .views.create_api import CreateStudySession, EndStudySession, CreateSubject, CreateCategoryBlock, EndCategoryBlock, CancelStudySession, CleanupHangingSessions, UpdateSessionRating
from .views.category_api import CategoryList, CategoryDetail, BreakCategory
from .views.goal_api import WeeklyGoalView, HasGoalsView
from .views.user_api import UserProfileView, UserTimezoneView, AccountDeletionView
from .views.auth_api import (
    custom_token_obtain_pair,
    register_user,
    logout_user,
    request_password_reset,
    confirm_password_reset,
    get_user_profile,
    update_premium_status
)

urlpatterns = [
    # ========================
    # AUTHENTICATION ENDPOINTS
    # ========================
    path('auth/register/', register_user, name='auth-register'),
    path('auth/login/', custom_token_obtain_pair, name='auth-login'),
    path('auth/logout/', logout_user, name='auth-logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/password-reset/', request_password_reset, name='auth-password-reset'),
    path('auth/password-reset/confirm/', confirm_password_reset, name='auth-password-reset-confirm'),
    path('auth/profile/', get_user_profile, name='auth-profile'),

    # ========================
    # PREMIUM/IAP ENDPOINTS
    # ========================
    path('user/premium-status/', update_premium_status, name='update-premium-status'),

    # ========================
    # STUDY SESSION ENDPOINTS
    # ========================
    path('create-session/', CreateStudySession.as_view(), name='create-session'),
    path('end-session/<int:id>/', EndStudySession.as_view(), name='end-session'),
    path('cancel-session/<int:id>/', CancelStudySession.as_view(), name='cancel-session'),
    path('update-session-rating/<int:id>/', UpdateSessionRating.as_view(), name='update-session-rating'),
    path('cleanup-hanging-sessions/', CleanupHangingSessions.as_view(), name='cleanup-hanging-sessions'),
    
    # ========================
    # CATEGORY ENDPOINTS
    # ========================
    path('create-subject/', CreateSubject.as_view(), name='create-subject'),
    path('create-category-block/', CreateCategoryBlock.as_view(), name='create-category-block'),
    path('end-category-block/<int:id>/', EndCategoryBlock.as_view(), name='end-category-block'),
    path('category-list/', CategoryList.as_view(), name='category-list'),
    path('categories/<int:pk>/', CategoryDetail.as_view(), name='category-detail'),
    path('break-category/', BreakCategory.as_view(), name='break-category'),
    
    # ========================
    # ANALYTICS ENDPOINTS
    # ========================
    path('insights/daily/', DailyInsights.as_view(), name='daily-insights'),
    path('insights/weekly/', WeeklyInsights.as_view(), name='weekly-insights'),
    path('insights/monthly/', MonthlyInsights.as_view(), name='monthly-insights'),
    
    # ========================
    # USER MANAGEMENT ENDPOINTS
    # ========================
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('user/timezone/', UserTimezoneView.as_view(), name='user-timezone'),
    path('account/delete/', AccountDeletionView.as_view(), name='account-delete'),
    path('goals/weekly/', WeeklyGoalView.as_view(), name='weekly-goal'),
    path('goals/has-goals/', HasGoalsView.as_view(), name='has-goals'),
] 