from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Batch, LabTest, Certificate
from .serializers import BatchSerializer, LabTestSerializer, CertificateSerializer
from asalitrace.blockchain.eth_adapter import add_batch_to_chain, get_batch_from_chain, test_connection
import logging
import os
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save to local database first
        batch = serializer.save()

        # Create description from batch data for blockchain
        # Smart contract only stores batchId and description, so we combine fields
        description = f"{batch.honey_type} - {batch.producer_name} - Qty: {batch.quantity}kg"

        # Write to blockchain with transaction verification
        try:
            tx_hash = add_batch_to_chain(
                batch_id=batch.batch_id,
                description=description
            )
            logger.info(f"Batch {batch.batch_id} recorded on-chain: {tx_hash}")

            # Update batch with blockchain transaction hash
            batch.blockchain_tx_hash = tx_hash
            batch.save()

            # Include blockchain reference in response
            data = serializer.data
            data["blockchain_tx_hash"] = tx_hash

            headers = self.get_success_headers(serializer.data)
            return Response(data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            logger.error(f"Blockchain error: {str(e)}")
            # Batch is already saved to database, but blockchain write failed
            # Return success with warning about blockchain
            data = serializer.data
            data["blockchain_tx_hash"] = None
            data["blockchain_warning"] = f"Batch saved to database but blockchain write failed: {str(e)}"
            
            return Response(
                data,
                status=status.HTTP_201_CREATED
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve batch and optionally verify on blockchain."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Optionally verify on blockchain if tx_hash exists
        if instance.blockchain_tx_hash:
            try:
                blockchain_data = get_batch_from_chain(instance.batch_id)
                if blockchain_data:
                    data["blockchain_verified"] = True
                    data["blockchain_data"] = blockchain_data
                else:
                    data["blockchain_verified"] = False
            except Exception as e:
                logger.warning(f"Could not verify batch on blockchain: {str(e)}")
                data["blockchain_verified"] = None
        
        return Response(data)

    @action(detail=True, methods=['post'], url_path='record-on-chain')
    def record_on_chain(self, request, pk=None):
        """Record an existing batch on the blockchain."""
        batch = self.get_object()
        
        # Check if already recorded
        if batch.blockchain_tx_hash:
            return Response({
                'message': 'Batch already recorded on blockchain',
                'blockchain_tx_hash': batch.blockchain_tx_hash
            }, status=status.HTTP_200_OK)
        
        # Test connection first to provide better error messages
        connection_test = test_connection()
        if not connection_test.get('connected'):
            return Response({
                'error': 'Cannot connect to blockchain node',
                'message': connection_test.get('error', 'Unknown connection error'),
                'rpc_url': connection_test.get('rpc_url'),
                'details': {
                    'has_private_key': bool(os.getenv("PRIVATE_KEY")),
                    'has_public_address': bool(os.getenv("PUBLIC_ADDRESS")),
                    'has_contract_address': bool(os.getenv("CONTRACT_ADDRESS")),
                }
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Get description from request or generate from batch data
        description = request.data.get('description')
        if not description:
            description = f"{batch.honey_type} - {batch.producer_name} - Qty: {batch.quantity}kg"
        
        try:
            # Record on blockchain
            tx_hash = add_batch_to_chain(
                batch_id=batch.batch_id,
                description=description
            )
            logger.info(f"Batch {batch.batch_id} recorded on-chain: {tx_hash}")
            
            # Update batch with blockchain transaction hash
            batch.blockchain_tx_hash = tx_hash
            batch.save()
            
            serializer = self.get_serializer(batch)
            return Response({
                'message': 'Batch recorded on blockchain successfully',
                'blockchain_tx_hash': tx_hash,
                'batch': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Blockchain error recording batch {batch.batch_id}: {error_msg}")
            
            # Provide more specific error messages
            if "PRIVATE_KEY" in error_msg or "PUBLIC_ADDRESS" in error_msg or "CONTRACT_ADDRESS" in error_msg:
                help_msg = "Please check your .env file and ensure all blockchain environment variables are set."
            elif "Cannot connect" in error_msg or "Cannot communicate" in error_msg:
                help_msg = "Please verify: 1) Hardhat node is running (npx hardhat node), 2) RPC URL is correct, 3) No firewall blocking connection."
            else:
                help_msg = "Make sure the Hardhat node is running: npx hardhat node"
            
            return Response({
                'error': error_msg,
                'message': help_msg,
                'details': {
                    'rpc_url': os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545"),
                    'has_private_key': bool(os.getenv("PRIVATE_KEY")),
                    'has_public_address': bool(os.getenv("PUBLIC_ADDRESS")),
                    'has_contract_address': bool(os.getenv("CONTRACT_ADDRESS")),
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='test-blockchain-connection')
    def test_blockchain_connection(self, request):
        """Test blockchain connection and return diagnostic information."""
        result = test_connection()
        
        if result.get('connected'):
            return Response({
                'status': 'connected',
                'chain_id': result.get('chain_id'),
                'block_number': result.get('block_number'),
                'rpc_url': result.get('rpc_url'),
                'message': 'Successfully connected to blockchain node'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'disconnected',
                'error': result.get('error'),
                'rpc_url': result.get('rpc_url'),
                'details': {
                    'has_private_key': bool(os.getenv("PRIVATE_KEY")),
                    'has_public_address': bool(os.getenv("PUBLIC_ADDRESS")),
                    'has_contract_address': bool(os.getenv("CONTRACT_ADDRESS")),
                },
                'message': 'Cannot connect to blockchain node. Check the error details above.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=False, methods=['get'], url_path='verify-batch/(?P<batch_id>[^/.]+)')
    def verify_batch_from_blockchain(self, request, batch_id=None):
        """Read batch data from blockchain via backend (no wallet needed)."""
        try:
            blockchain_data = get_batch_from_chain(batch_id)
            
            if blockchain_data:
                return Response({
                    'found': True,
                    'data': blockchain_data,
                    'message': 'Batch found on blockchain'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'found': False,
                    'message': 'Batch not found on blockchain'
                }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error reading batch from blockchain: {str(e)}")
            return Response({
                'found': False,
                'error': str(e),
                'message': 'Failed to read batch from blockchain'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LabTestViewSet(viewsets.ModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [AllowAny]


class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [AllowAny]
