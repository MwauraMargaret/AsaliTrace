from django.contrib import admin
from .models import Batch, LabTest, Certificate, AuditLog

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ['batch_id', 'producer_name', 'honey_type', 'status', 'created_by', 'owner', 'created_at']
    list_filter = ['status', 'honey_type', 'created_at']
    search_fields = ['batch_id', 'producer_name', 'created_by__email', 'owner__email']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    list_display = ['batch', 'test_type', 'tested_by', 'test_date', 'created_by', 'created_at']
    list_filter = ['test_type', 'test_date', 'created_at']
    search_fields = ['batch__batch_id', 'tested_by', 'created_by__email']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_id', 'batch', 'issued_by', 'issue_date', 'created_by', 'created_at']
    list_filter = ['issue_date', 'created_at']
    search_fields = ['certificate_id', 'issued_by', 'batch__batch_id', 'created_by__email']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user_email', 'batch', 'lab_test', 'certificate', 'timestamp', 'blockchain_tx_hash']
    list_filter = ['action', 'timestamp']
    search_fields = ['user_email', 'action_description', 'batch__batch_id']
    readonly_fields = ['timestamp', 'old_values', 'new_values']
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False  # Audit logs should only be created programmatically
