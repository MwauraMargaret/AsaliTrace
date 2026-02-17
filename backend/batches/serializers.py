from rest_framework import serializers
from django.contrib.auth import get_user_model

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'email', 'first_name', 'last_name', 'is_superuser', 'is_staff']

from rest_framework import serializers
from .models import Batch, LabTest, Certificate, AuditLog

class BatchSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    is_blockchain_verified = serializers.BooleanField(read_only=True)
    has_suspicious_activity = serializers.BooleanField(read_only=True)
    verification_status = serializers.CharField(read_only=True)
    
    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ['created_by', 'owner', 'created_at', 'updated_at']

class LabTestSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    is_blockchain_verified = serializers.BooleanField(read_only=True)
    verification_status = serializers.CharField(read_only=True)
    flagged_by_email = serializers.EmailField(source='flagged_by.email', read_only=True)
    
    class Meta:
        model = LabTest
        fields = '__all__'
        read_only_fields = [
            'created_by', 'created_at', 'updated_at', 
            'is_flagged', 'flagged_by', 'flag_reason', 'flag_timestamp'
        ]

class CertificateSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    is_blockchain_verified = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    verification_status = serializers.CharField(read_only=True)
    verified_by_email = serializers.EmailField(source='verified_by.email', read_only=True)
    flagged_by_email = serializers.EmailField(source='flagged_by.email', read_only=True)
    
    class Meta:
        model = Certificate
        fields = '__all__'
        read_only_fields = [
            'created_by', 'created_at', 'updated_at',
            'is_verified', 'verified_by', 'verification_timestamp',
            'is_flagged', 'flagged_by', 'flag_reason', 'flag_timestamp'
        ]

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(read_only=True)
    
    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ['timestamp']