from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse
from . import views
from .api_views import api_root
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home, name='home'),

    # API authentication
    path('api/auth/', include('accounts.urls')),  
    
    # Django admin authentication
    path('accounts/', include('django.contrib.auth.urls')),
    # Django admin authentication - traditional login forms
    #path('accounts/login/', auth_views.LoginView.as_view(), name='login'),
    #path('accounts/logout/', auth_views.LogoutView.as_view(), name='logout'),
    
    path('admin/', admin.site.urls),
    path('api/', include('batches.urls')),
    
    # EXACT match API root - must be last
    path('api/', api_root, name='api-root'),
]
