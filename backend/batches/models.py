from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Batch(models.Model):
    BATCH_STATUS = [
        ('created', 'Created'),
        ('tested', 'Tested'),
        ('certified', 'Certified'),
        ('shipped', 'Shipped'),
    ]
    
    batch_id = models.CharField(max_length=100, unique=True)
    producer_name = models.CharField(max_length=200)
    production_date = models.DateField()
    honey_type = models.CharField(max_length=100)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=BATCH_STATUS, default='created')
    blockchain_tx_hash = models.CharField(max_length=66, blank=True, null=True)
    # User ownership
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_batches')
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_batches', help_text="Current owner of the batch")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.batch_id} - {self.honey_type}"

class LabTest(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='lab_tests')
    test_type = models.CharField(max_length=100)
    result = models.TextField()
    tested_by = models.CharField(max_length=200)
    test_date = models.DateField()
    blockchain_tx_hash = models.CharField(max_length=66, blank=True, null=True)
    # User ownership
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_lab_tests')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    def __str__(self):
        return f"Test for {self.batch.batch_id}"

class Certificate(models.Model):
    batch = models.OneToOneField(Batch, on_delete=models.CASCADE)
    certificate_id = models.CharField(max_length=100, unique=True)
    issued_by = models.CharField(max_length=200)
    issue_date = models.DateField()
    expiry_date = models.DateField()
    blockchain_tx_hash = models.CharField(max_length=66, blank=True, null=True)
    # User ownership
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_certificates')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    def __str__(self):
        return f"Certificate {self.certificate_id}"


class AuditLog(models.Model):
    """Audit trail for all batch-related operations."""
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('record_blockchain', 'Record on Blockchain'),
        ('verify_blockchain', 'Verify on Blockchain'),
    ]
    
    # What was changed
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='audit_logs', null=True, blank=True)
    lab_test = models.ForeignKey(LabTest, on_delete=models.CASCADE, related_name='audit_logs', null=True, blank=True)
    certificate = models.ForeignKey(Certificate, on_delete=models.CASCADE, related_name='audit_logs', null=True, blank=True)
    
    # Who made the change
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_actions')
    user_email = models.CharField(max_length=255, blank=True, help_text="Stored for audit even if user is deleted")
    
    # What action
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    action_description = models.TextField(blank=True, help_text="Human-readable description of the action")
    
    # Changes made
    old_values = models.JSONField(null=True, blank=True, help_text="Previous values before change")
    new_values = models.JSONField(null=True, blank=True, help_text="New values after change")
    
    # Blockchain info
    blockchain_tx_hash = models.CharField(max_length=66, blank=True, null=True)
    
    # When
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['batch', '-timestamp']),
        ]
    
    def __str__(self):
        entity = self.batch or self.lab_test or self.certificate
        entity_name = str(entity) if entity else "Unknown"
        return f"{self.action} - {entity_name} by {self.user_email or 'Anonymous'} at {self.timestamp}"