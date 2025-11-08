# backend/batches/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BatchViewSet, LabTestViewSet, CertificateViewSet

router = DefaultRouter()
router.register(r'batches', BatchViewSet)
router.register(r'labtests', LabTestViewSet)
router.register(r'certificates', CertificateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
