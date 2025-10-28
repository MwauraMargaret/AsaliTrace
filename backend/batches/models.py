from django.db import models

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
    
    def __str__(self):
        return f"Test for {self.batch.batch_id}"

class Certificate(models.Model):
    batch = models.OneToOneField(Batch, on_delete=models.CASCADE)
    certificate_id = models.CharField(max_length=100, unique=True)
    issued_by = models.CharField(max_length=200)
    issue_date = models.DateField()
    expiry_date = models.DateField()
    blockchain_tx_hash = models.CharField(max_length=66, blank=True, null=True)
    
    def __str__(self):
        return f"Certificate {self.certificate_id}"