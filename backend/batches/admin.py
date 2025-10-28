from django.contrib import admin
from .models import Batch, LabTest, Certificate

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ['batch_id', 'producer_name', 'honey_type', 'status', 'created_at']
    list_filter = ['status', 'honey_type']
    search_fields = ['batch_id', 'producer_name']

@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    list_display = ['batch', 'test_type', 'tested_by', 'test_date']
    list_filter = ['test_type']

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_id', 'batch', 'issued_by', 'issue_date']
    search_fields = ['certificate_id']