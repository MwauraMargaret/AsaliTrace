from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Batch, LabTest, Certificate
from .serializers import BatchSerializer, LabTestSerializer, CertificateSerializer
from asalitrace.blockchain.eth_adapter import add_batch_to_chain  
from asalitrace.blockchain.eth_adapter import EthereumAdapter
import logging
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save to local database
        batch = serializer.save()

        # Write to blockchain
        try:
            tx_hash = add_batch_to_chain(
                batch_id=batch.batchId,
                description=batch.description
            )
            logger.info(f"Batch {batch.batchId} recorded on-chain: {tx_hash}")

            # Step 3: Include blockchain reference in response
            data = serializer.data
            data["blockchain_tx_hash"] = tx_hash

            headers = self.get_success_headers(serializer.data)
            return Response(data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            logger.error(f"Blockchain error: {str(e)}")
            return Response(
                {"error": "Failed to record batch on blockchain", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LabTestViewSet(viewsets.ModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [AllowAny]


class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [AllowAny]
