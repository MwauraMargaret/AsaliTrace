from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from . import views

#def api_root(request):
 #   return JsonResponse({
  #      'message': 'Welcome to HoneyTrace API',
   #     'endpoints': {
    #        'admin': '/admin/',
     #       'api_root': '/api/',
     #       'auth': '/api/auth/',
      #      'batches': '/api/batches/',
       #     'lab_tests': '/api/lab-tests/',
        #    'certificates': '/api/certificates/'
     #   }
  #  }

urlpatterns = [
    path('', views.home, name='home'), 
   # path('api/', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path("accounts/", include("accounts.urls")),
    path('api/', include('batches.urls')),
    path('api/auth/', include('accounts.urls')), 
   # path("api/auth/", include("dj_rest_auth.urls")),
   # path("api/auth/registration/", include("dj_rest_auth.registration.urls")),
   # path("api/auth/social/", include("allauth.socialaccount.urls")),
    #path("api/2fa/", include("two_factor.urls")),
]