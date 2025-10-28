from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Batch, LabTest, Certificate
from .serializers import BatchSerializer, LabTestSerializer, CertificateSerializer
#rom asalitrace.blockchain.eth_adapter import EthereumAdapter

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Save to database
        batch = serializer.save()
        
        # TODO: Integrate with blockchain
        # blockchain_adapter = EthereumAdapter()
        # tx_result = blockchain_adapter.create_batch(serializer.data)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class LabTestViewSet(viewsets.ModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer

class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer