from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'batches', views.BatchViewSet)
router.register(r'lab-tests', views.LabTestViewSet)
router.register(r'certificates', views.CertificateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]