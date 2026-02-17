"""
Utility functions for batches app, including audit logging.
"""
import logging
from django.contrib.auth import get_user_model
from django.db import models
from .models import AuditLog, Batch, LabTest, Certificate

User = get_user_model()
logger = logging.getLogger(__name__)


def log_audit_action(
    action,
    user,
    batch=None,
    lab_test=None,
    certificate=None,
    action_description="",
    old_values=None,
    new_values=None,
    blockchain_tx_hash=None,
    request=None
):
    """
    Create an audit log entry for any action.
    
    Args:
        action: One of 'create', 'update', 'delete', 'record_blockchain', 'verify_blockchain'
        user: User object or None
        batch: Batch instance or None
        lab_test: LabTest instance or None
        certificate: Certificate instance or None
        action_description: Human-readable description
        old_values: Dict of old values (for updates)
        new_values: Dict of new values (for updates/creates)
        blockchain_tx_hash: Transaction hash if blockchain-related
        request: Django request object (for IP and user agent)
    """
    try:
        user_email = user.email if user and hasattr(user, 'email') else 'Anonymous'
        
        # Get IP and user agent from request
        ip_address = None
        user_agent = ""
        if request:
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]  # Limit length
        
        audit_log = AuditLog.objects.create(
            batch=batch,
            lab_test=lab_test,
            certificate=certificate,
            user=user,
            user_email=user_email,
            action=action,
            action_description=action_description,
            old_values=old_values,
            new_values=new_values,
            blockchain_tx_hash=blockchain_tx_hash,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info(f"Audit log created: {audit_log}")
        return audit_log
    except Exception as e:
        logger.error(f"Failed to create audit log: {str(e)}")
        # Don't fail the main operation if audit logging fails
        return None


def get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def can_user_access_batch(user, batch):
    """
    Check if user can access a batch.
    - Admins can access all batches
    - Users can access batches they created or own
    """
    if not user or not user.is_authenticated:
        return False
    
    # Admins have full access
    if user.is_staff or user.is_superuser:
        return True
    
    # Users can access their own batches
    if batch.created_by == user or batch.owner == user:
        return True
    
    return False


def get_user_batches(user):
    """
    Get batches accessible to a user.
    - Admins get all batches
    - Regular users get only their batches
    """
    if not user or not user.is_authenticated:
        return Batch.objects.none()
    
    if user.is_staff or user.is_superuser:
        return Batch.objects.all()
    
    return Batch.objects.filter(
        models.Q(created_by=user) | models.Q(owner=user)
    )

