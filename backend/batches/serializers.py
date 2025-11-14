from rest_framework import serializers
from .models import Batch, LabTest, Certificate, AuditLog

class BatchSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    
    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ['created_by', 'owner', 'created_at', 'updated_at']

class LabTestSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    
    class Meta:
        model = LabTest
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']

class CertificateSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    
    class Meta:
        model = Certificate
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ['timestamp']