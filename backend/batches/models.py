from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class Batch(models.Model):
    # User-level batch status choices for creation
    BATCH_STATUS = [
        ('created', 'Created'),
        ('harvested', 'Harvested'),
        ('processing', 'Processing'),
        ('packaged', 'Packaged'),
    ]

    HONEY_TYPES = [
        ('wildflower', 'Wildflower Honey'),
        ('acacia', 'Acacia Honey'),
        ('manuka', 'Manuka Honey'),
        ('clover', 'Clover Honey'),
        ('eucalyptus', 'Eucalyptus Honey'),
        ('orange_blossom', 'Orange Blossom Honey'),
        ('lavender', 'Lavender Honey'),
        ('sunflower', 'Sunflower Honey'),
        ('multiflora', 'Multiflora Honey'),
        ('forest', 'Forest Honey'),
    ]

    # Core batch information
    batch_id = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="Unique identifier for the batch (e.g., BATCH-2024-001)"
    )
    producer_name = models.CharField(
        max_length=200, 
        help_text="Name of the beekeeper or producer"
    )
    production_date = models.DateField(
        help_text="Date when the honey was harvested/produced"
    )
    honey_type = models.CharField(
        max_length=50, 
        choices=HONEY_TYPES, 
        default='wildflower'
    )
    quantity = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Quantity in kilograms"
    )
    status = models.CharField(
        max_length=20, 
        choices=BATCH_STATUS, 
        default='draft'
    )

    # Blockchain integration
    blockchain_tx_hash = models.CharField(
        max_length=66, 
        null=True, 
        blank=True,
        help_text="Transaction hash from blockchain recording"
    )

    # Ownership and tracking
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_batches'
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_batches'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Additional fields for traceability
    location = models.CharField(
        max_length=200, 
        blank=True, 
        help_text="Geographical origin of the honey"
    )
    harvest_method = models.CharField(
        max_length=100, 
        blank=True, 
        help_text="Method used for harvesting"
    )
    processing_notes = models.TextField(
        blank=True, 
        help_text="Additional notes about processing"
    )

    class Meta:
        verbose_name = "Batch"
        verbose_name_plural = "Batches"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['batch_id']),
            models.Index(fields=['producer_name']),
            models.Index(fields=['honey_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.batch_id} - {self.honey_type} - {self.producer_name}"

    @property
    def is_blockchain_verified(self):
        """Check if batch is recorded on blockchain"""
        return bool(self.blockchain_tx_hash)

    @property
    def has_suspicious_activity(self):
        """Check if batch has any flagged items"""
        has_flagged_lab_tests = self.lab_tests.filter(is_flagged=True).exists()
        has_flagged_certificate = False
        # Use singular 'certificate' for OneToOne relationship
        if hasattr(self, 'certificate') and self.certificate:
            has_flagged_certificate = self.certificate.is_flagged
        return has_flagged_lab_tests or has_flagged_certificate

    @property
    def verification_status(self):
        """Get overall verification status"""
        if self.has_suspicious_activity:
            return "flagged"
        elif self.is_blockchain_verified:
            return "verified"
        else:
            return "pending"

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('batch-detail', kwargs={'pk': self.pk})


class LabTest(models.Model):
    TEST_TYPES = [
        ('purity', 'Purity Test'),
        ('moisture', 'Moisture Content'),
        ('hmf', 'Hydroxymethylfurfural (HMF)'),
        ('diastase', 'Diastase Activity'),
        ('sucrose', 'Sucrose Content'),
        ('glucose', 'Glucose Content'),
        ('fructose', 'Fructose Content'),
        ('pesticides', 'Pesticide Residue'),
        ('antibiotics', 'Antibiotic Residue'),
        ('heavy_metals', 'Heavy Metals'),
        ('microbiological', 'Microbiological Analysis'),
    ]

    # Core test information
    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name='lab_tests'
    )
    test_type = models.CharField(
        max_length=50, 
        choices=TEST_TYPES
    )
    result = models.TextField(
        help_text="Detailed test results and findings"
    )
    tested_by = models.CharField(
        max_length=200, 
        help_text="Name of the laboratory or testing facility"
    )
    test_date = models.DateField(
        help_text="Date when the test was conducted"
    )

    # Blockchain integration
    blockchain_tx_hash = models.CharField(
        max_length=66, 
        null=True, 
        blank=True,
        help_text="Transaction hash from blockchain recording"
    )

    # Admin review fields
    is_flagged = models.BooleanField(
        default=False,
        help_text="Marked as suspicious by admin"
    )
    flagged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='flagged_lab_tests',
        help_text="Admin who flagged this test"
    )
    flag_reason = models.TextField(
        blank=True,
        help_text="Reason for flagging this test as suspicious"
    )
    flag_timestamp = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When this test was flagged"
    )

    # Ownership and tracking
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_lab_tests'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Lab Test"
        verbose_name_plural = "Lab Tests"
        ordering = ['-test_date', '-created_at']
        indexes = [
            models.Index(fields=['batch']),
            models.Index(fields=['test_type']),
            models.Index(fields=['test_date']),
            models.Index(fields=['is_flagged']),
        ]

    def __str__(self):
        return f"{self.test_type} - {self.batch.batch_id} - {self.test_date}"

    @property
    def is_blockchain_verified(self):
        """Check if lab test is recorded on blockchain"""
        return bool(self.blockchain_tx_hash)

    @property
    def verification_status(self):
        """Get verification status"""
        if self.is_flagged:
            return "flagged"
        elif self.is_blockchain_verified:
            return "verified"
        else:
            return "pending"

    def flag(self, user, reason):
        """Flag this lab test as suspicious"""
        self.is_flagged = True
        self.flagged_by = user
        self.flag_reason = reason
        self.flag_timestamp = timezone.now()
        self.save()

    def unflag(self):
        """Remove flag from this lab test"""
        self.is_flagged = False
        self.flagged_by = None
        self.flag_reason = ""
        self.flag_timestamp = None
        self.save()


class Certificate(models.Model):
    CERTIFICATE_TYPES = [
        ('organic', 'Organic Certification'),
        ('purity', 'Purity Certification'),
        ('origin', 'Origin Certification'),
        ('quality', 'Quality Certification'),
        ('sustainability', 'Sustainability Certification'),
    ]

    # Core certificate information
    batch = models.OneToOneField(  # FIX: This is OneToOne, not ForeignKey
        Batch,
        on_delete=models.CASCADE,
        related_name='certificate'  # FIX: Singular name for OneToOne
    )
    certificate_id = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Unique certificate identifier"
    )
    issued_by = models.CharField(
        max_length=200, 
        help_text="Certification authority or organization"
    )
    issue_date = models.DateField(
        help_text="Date when certificate was issued"
    )
    expiry_date = models.DateField(
        help_text="Date when certificate expires"
    )
    certificate_type = models.CharField(
        max_length=50, 
        choices=CERTIFICATE_TYPES, 
        default='quality'
    )

    # Blockchain integration
    blockchain_tx_hash = models.CharField(
        max_length=66, 
        null=True, 
        blank=True,
        help_text="Transaction hash from blockchain recording"
    )

    # Admin verification fields
    is_verified = models.BooleanField(
        default=False,
        help_text="Verified by admin"
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_certificates',
        help_text="Admin who verified this certificate"
    )
    verification_timestamp = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When this certificate was verified"
    )

    # Admin flagging fields
    is_flagged = models.BooleanField(
        default=False,
        help_text="Marked as suspicious by admin"
    )
    flagged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='flagged_certificates',
        help_text="Admin who flagged this certificate"
    )
    flag_reason = models.TextField(
        blank=True,
        help_text="Reason for flagging this certificate as suspicious"
    )
    flag_timestamp = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When this certificate was flagged"
    )

    # Ownership and tracking
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_certificates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Certificate"
        verbose_name_plural = "Certificates"
        ordering = ['-issue_date', '-created_at']
        indexes = [
            models.Index(fields=['batch']),
            models.Index(fields=['certificate_id']),
            models.Index(fields=['issued_by']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['is_flagged']),
        ]

    def __str__(self):
        return f"{self.certificate_id} - {self.batch.batch_id}"

    @property
    def is_blockchain_verified(self):
        """Check if certificate is recorded on blockchain"""
        return bool(self.blockchain_tx_hash)

    @property
    def is_expired(self):
        """Check if certificate has expired"""
        return timezone.now().date() > self.expiry_date

    @property
    def days_until_expiry(self):
        """Calculate days until certificate expires"""
        today = timezone.now().date()
        return (self.expiry_date - today).days

    @property
    def verification_status(self):
        """Get verification status"""
        if self.is_flagged:
            return "flagged"
        elif self.is_verified:
            return "verified"
        elif self.is_blockchain_verified:
            return "blockchain_verified"
        else:
            return "pending"

    def verify(self, user):
        """Verify this certificate"""
        self.is_verified = True
        self.verified_by = user
        self.verification_timestamp = timezone.now()
        self.save()

    def flag(self, user, reason):
        """Flag this certificate as suspicious"""
        self.is_flagged = True
        self.flagged_by = user
        self.flag_reason = reason
        self.flag_timestamp = timezone.now()
        self.save()

    def unflag(self):
        """Remove flag from this certificate"""
        self.is_flagged = False
        self.flagged_by = None
        self.flag_reason = ""
        self.flag_timestamp = None
        self.save()


class AuditLog(models.Model):
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('record_blockchain', 'Record on Blockchain'),
        ('flag_lab_test', 'Flag Lab Test'),
        ('flag_certificate', 'Flag Certificate'),
        ('verify_certificate', 'Verify Certificate'),
        ('unflag_lab_test', 'Unflag Lab Test'),
        ('unflag_certificate', 'Unflag Certificate'),
    ]

    # Core audit information
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    action_description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    # User information
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    user_email = models.EmailField(blank=True)  # Store email in case user is deleted
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    # Related objects
    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    lab_test = models.ForeignKey(
        LabTest,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    certificate = models.ForeignKey(
        Certificate,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='audit_logs'
    )

    # Additional context
    blockchain_tx_hash = models.CharField(max_length=66, null=True, blank=True)
    old_values = models.JSONField(null=True, blank=True, help_text="Values before change")
    new_values = models.JSONField(null=True, blank=True, help_text="Values after change")

    class Meta:
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['action']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['user']),
            models.Index(fields=['batch']),
        ]

    def __str__(self):
        return f"{self.action} - {self.action_description} - {self.timestamp}"

    def save(self, *args, **kwargs):
        # Store user email for audit trail even if user is deleted
        if self.user and not self.user_email:
            self.user_email = self.user.email
        super().save(*args, **kwargs)


# Utility functions for the models
def log_audit_action(action, user=None, batch=None, lab_test=None, certificate=None, 
                    action_description="", blockchain_tx_hash=None, old_values=None, 
                    new_values=None, ip_address=None, request=None):
    """
    Utility function to create audit log entries
    """
    from django.contrib.auth.models import AnonymousUser
    
    # Get IP address from request if available
    if request and not ip_address:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
    
    # Handle anonymous users
    if user and isinstance(user, AnonymousUser):
        user = None
    
    AuditLog.objects.create(
        action=action,
        action_description=action_description,
        user=user,
        user_email=user.email if user and hasattr(user, 'email') else '',
        batch=batch,
        lab_test=lab_test,
        certificate=certificate,
        blockchain_tx_hash=blockchain_tx_hash,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address
    )


def can_user_access_batch(user, batch):
    """
    Check if user has permission to access a batch
    """
    if not user or not user.is_authenticated:
        return False
    
    # Admins can access all batches
    if user.is_staff or user.is_superuser:
        return True
    
    # Users can access batches they created or own
    return (batch.created_by == user or batch.owner == user)