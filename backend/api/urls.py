from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.MeView.as_view(), name='me'),

    # Quizzes
    path('quizzes/', views.QuizListCreateView.as_view(), name='quiz-list-create'),
    path('quizzes/<int:quiz_id>/', views.QuizDetailView.as_view(), name='quiz-detail'),

    # Attempts
    path('quizzes/<int:quiz_id>/start/', views.StartAttemptView.as_view(), name='start-attempt'),
    path('attempts/', views.AttemptListView.as_view(), name='attempt-list'),
    path('attempts/<int:attempt_id>/', views.AttemptDetailView.as_view(), name='attempt-detail'),
    path('attempts/<int:attempt_id>/answer/', views.SubmitAnswerView.as_view(), name='submit-answer'),
    path('attempts/<int:attempt_id>/complete/', views.CompleteAttemptView.as_view(), name='complete-attempt'),

    # Stats
    path('stats/', views.UserStatsView.as_view(), name='user-stats'),
]
