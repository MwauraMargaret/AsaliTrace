from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse
from . import views
from .api_views import api_root

urlpatterns = [
    path('', views.home, name='home'), 
    re_path(r'^api/$', api_root, name='api-root'),  # Public API root - exact match only
    path('admin/', admin.site.urls),
    path("accounts/", include("accounts.urls")),
    path('api/', include('batches.urls')),  # This creates /api/batches/, /api/labtests/, /api/certificates/
    path('api/auth/', include('accounts.urls')), 
]
