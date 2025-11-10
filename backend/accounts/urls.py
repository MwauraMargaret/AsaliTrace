from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from . import twofa_views
from . import social_views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('user/', views.get_user, name='get_user'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

     # 2FA endpoints
    path('2fa/setup/', twofa_views.setup_2fa, name='setup_2fa'),
    path('2fa/verify-setup/', twofa_views.verify_2fa_setup, name='verify_2fa_setup'),
    path('2fa/disable/', twofa_views.disable_2fa, name='disable_2fa'),
    path('2fa/verify-login/', twofa_views.verify_2fa_login, name='verify_2fa_login'),

    # Social auth endpoints
    path('social/google/', social_views.google_auth, name='google_auth'),
    path('social/github/', social_views.github_auth, name='github_auth'),
    path('social/apple/', social_views.apple_auth, name='apple_auth'),
    
    # Alternative paths for frontend compatibility
    path('social/google', social_views.google_auth, name='google_auth_alt'),
    path('social/github', social_views.github_auth, name='github_auth_alt'),
]