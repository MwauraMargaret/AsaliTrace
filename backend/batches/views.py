from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import Http404
from .models import Batch, LabTest, Certificate
from django.db import models
from .serializers import BatchSerializer, LabTestSerializer, CertificateSerializer
from asalitrace.blockchain.eth_adapter import (
    add_batch_to_chain, 
    get_batch_from_chain, 
    add_lab_test_to_chain,
    get_lab_test_from_chain,
    issue_certificate_on_chain,
    get_certificate_from_chain,
    test_connection
)
import logging
import os
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.exceptions import PermissionDenied
from .utils import log_audit_action, can_user_access_batch, get_user_batches

logger = logging.getLogger(__name__)


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]  # Require authentication

    def get_queryset(self):
        """Filter batches based on user permissions."""
        user = self.request.user
        
        if not user.is_authenticated:
            return Batch.objects.none()
        
        # Admins see all batches
        if user.is_staff or user.is_superuser:
            return Batch.objects.all()
        
        # Regular users see only their batches
        return Batch.objects.filter(
            models.Q(created_by=user) | models.Q(owner=user)
        )

    def get_object(self):
        """Override to check access permissions and support batch_id lookup."""
        # Get the lookup value from URL
        lookup_value = self.kwargs.get(self.lookup_field)
        user = self.request.user
        
        # First, try to find the batch (check if it exists at all)
        # Use unfiltered queryset to check existence, then filter for permissions
        try:
            # Try primary key lookup first (default DRF behavior)
            try:
                # Use the base queryset without filtering to check existence
                obj = Batch.objects.get(pk=lookup_value)
            except (Batch.DoesNotExist, ValueError):
                # If pk lookup fails, try batch_id lookup
                try:
                    obj = Batch.objects.get(batch_id=lookup_value)
                except Batch.DoesNotExist:
                    raise Http404("Batch not found")
        except Http404:
            raise
        
        # Now check if user has permission to access this batch
        if not can_user_access_batch(user, obj):
            # Return 403 Permission Denied (not 404) if batch exists but user can't access it
            raise PermissionDenied("You do not have permission to access this batch.")
        
        return obj

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Set ownership - pass user fields directly to save()
        user = request.user if request.user.is_authenticated else None

        # Save to local database first with ownership
        batch = serializer.save(created_by=user, owner=user)
        
        # Log audit trail
        log_audit_action(
            action='create',
            user=user,
            batch=batch,
            action_description=f"Created batch {batch.batch_id}",
            new_values={
                'batch_id': batch.batch_id,
                'producer_name': batch.producer_name,
                'honey_type': batch.honey_type,
                'quantity': str(batch.quantity),
                'status': batch.status,
            },
            request=request
        )

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

            # Verify the batch was actually created on blockchain
            try:
                from asalitrace.blockchain.eth_adapter import get_batch_from_chain
                verify_batch = get_batch_from_chain(batch.batch_id)
                if not verify_batch:
                    logger.warning(f"Batch {batch.batch_id} has TX hash {tx_hash} but was not found on blockchain. Transaction may have failed.")
                    # Still save the hash, but add a warning
                    batch.blockchain_tx_hash = tx_hash
                    batch.save()
                    data = serializer.data
                    data["blockchain_tx_hash"] = tx_hash
                    data["blockchain_warning"] = f"Transaction sent ({tx_hash[:20]}...) but batch not found on blockchain. The transaction may have failed. Please check the transaction status."
                    return Response(data, status=status.HTTP_201_CREATED)
            except Exception as verify_err:
                logger.warning(f"Could not verify batch creation: {str(verify_err)}")
                # Continue anyway - the transaction was sent

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
            old_tx_hash = batch.blockchain_tx_hash
            batch.blockchain_tx_hash = tx_hash
            batch.save()
            
            # Log audit trail
            log_audit_action(
                action='record_blockchain',
                user=request.user if request.user.is_authenticated else None,
                batch=batch,
                action_description=f"Recorded batch {batch.batch_id} on blockchain",
                blockchain_tx_hash=tx_hash,
                old_values={'blockchain_tx_hash': old_tx_hash} if old_tx_hash else None,
                new_values={'blockchain_tx_hash': tx_hash},
                request=request
            )
            
            serializer = self.get_serializer(batch)
            return Response({
                'message': 'Batch recorded on blockchain successfully',
                'blockchain_tx_hash': tx_hash,
                'batch': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Blockchain error recording batch {batch.batch_id}: {error_msg}")
            logger.error(f"Full exception details: {type(e).__name__}: {error_msg}")
            
            # Check environment variables
            has_private_key = bool(os.getenv("PRIVATE_KEY"))
            has_public_address = bool(os.getenv("PUBLIC_ADDRESS"))
            has_contract_address = bool(os.getenv("CONTRACT_ADDRESS"))
            rpc_url = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
            
            # Provide more specific error messages based on error type
            if "PRIVATE_KEY" in error_msg or not has_private_key:
                help_msg = "PRIVATE_KEY environment variable is missing. Please set it in your backend .env file."
            elif "PUBLIC_ADDRESS" in error_msg or not has_public_address:
                help_msg = "PUBLIC_ADDRESS environment variable is missing. Please set it in your backend .env file."
            elif "CONTRACT_ADDRESS" in error_msg or not has_contract_address:
                help_msg = "CONTRACT_ADDRESS environment variable is missing. Please deploy the contract and set the address in your backend .env file."
            elif "Cannot connect" in error_msg or "Cannot communicate" in error_msg or "Connection refused" in error_msg:
                help_msg = f"Cannot connect to Hardhat node at {rpc_url}. Please verify: 1) Hardhat node is running (npx hardhat node), 2) RPC URL is correct, 3) No firewall blocking connection."
            elif "ABI not found" in error_msg or "Contract ABI" in error_msg:
                help_msg = "Contract ABI file not found. Please ensure the contract is compiled and the ABI file exists."
            elif "Transaction failed" in error_msg:
                help_msg = "Blockchain transaction failed. Check Hardhat node logs for details."
            else:
                help_msg = f"Blockchain error: {error_msg}. Please verify: 1) Hardhat node is running (npx hardhat node), 2) All environment variables are set, 3) Contract is deployed."
            
            return Response({
                'error': error_msg,
                'message': help_msg,
                'details': {
                    'rpc_url': rpc_url,
                    'has_private_key': has_private_key,
                    'has_public_address': has_public_address,
                    'has_contract_address': has_contract_address,
                    'contract_address': os.getenv("CONTRACT_ADDRESS") if has_contract_address else None,
                    'error_type': type(e).__name__,
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

    @action(detail=False, methods=['get'], url_path='verify-batch/(?P<batch_id>[^/]+)')
    def verify_batch_from_blockchain(self, request, batch_id=None):
        """Read batch data from blockchain via backend (no wallet needed)."""
        try:
            # Check if batch exists in database and has TX hash
            db_batch = None
            tx_hash = None
            tx_status = None
            try:
                db_batch = Batch.objects.filter(batch_id=batch_id).first()
                if db_batch and db_batch.blockchain_tx_hash:
                    tx_hash = db_batch.blockchain_tx_hash
                    # Check transaction receipt status
                    try:
                        from asalitrace.blockchain.eth_adapter import get_web3
                        web3 = get_web3()
                        receipt = web3.eth.get_transaction_receipt(tx_hash)
                        tx_status = receipt.status  # 1 = success, 0 = failed
                    except Exception as tx_err:
                        logger.debug(f"Could not check transaction receipt: {str(tx_err)}")
            except Exception as db_err:
                logger.debug(f"Could not check database: {str(db_err)}")
            
            blockchain_data = get_batch_from_chain(batch_id)
            
            if blockchain_data:
                return Response({
                    'found': True,
                    'data': blockchain_data,
                    'message': 'Batch found on blockchain',
                    'tx_hash': tx_hash,
                    'tx_status': tx_status
                }, status=status.HTTP_200_OK)
            else:
                # Provide more helpful message if batch has TX hash but not found
                response_data = {
                    'found': False,
                    'message': 'Batch not found on blockchain',
                    'has_tx_hash': tx_hash is not None,
                    'tx_hash': tx_hash,
                    'tx_status': tx_status
                }
                
                if tx_hash:
                    if tx_status == 0:
                        response_data['message'] = f'Transaction failed (status 0). TX hash: {tx_hash[:20]}... The batch was not created on the blockchain.'
                        response_data['suggestion'] = 'Try creating the batch again or check Hardhat logs for revert reason.'
                    elif tx_status == 1:
                        response_data['message'] = f'Transaction succeeded (status 1) but batch not found. TX hash: {tx_hash[:20]}... This may indicate a contract issue or batch ID mismatch.'
                        response_data['suggestion'] = 'Check if the batch_id matches exactly (case-sensitive).'
                    else:
                        response_data['message'] = f'Batch has transaction hash ({tx_hash[:20]}...) but was not found on blockchain. Transaction status: {tx_status if tx_status is not None else "unknown"}'
                        response_data['suggestion'] = 'Check the transaction status or try re-recording the batch.'
                
                return Response(response_data, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error reading batch from blockchain: {str(e)}")
            return Response({
                'found': False,
                'error': str(e),
                'message': 'Failed to read batch from blockchain'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='journey/(?P<batch_id>[^/.]+)')
    def journey(self, request, batch_id=None):
        """Get complete journey/audit trail for a batch by batch_id."""
        try:
            # Find batch by batch_id instead of pk
            try:
                batch = Batch.objects.get(batch_id=batch_id)
            except Batch.DoesNotExist:
                return Response({
                    'error': 'Batch not found',
                    'message': f'Batch with ID {batch_id} does not exist.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check permissions
            user = request.user
            if not can_user_access_batch(user, batch):
                if not user.is_authenticated:
                    return Response({
                        'error': 'Authentication required',
                        'message': 'Please login to view the journey for this batch.',
                        'detail': 'This endpoint requires authentication.'
                    }, status=status.HTTP_401_UNAUTHORIZED)
                else:
                    return Response({
                        'error': 'Permission denied',
                        'message': 'You do not have permission to view this batch. Only the batch owner or administrator can access this information.',
                        'detail': 'Batch ownership mismatch.'
                    }, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Error getting batch for journey: {str(e)}")
            # Re-raise if it's already a Response (from above)
            if isinstance(e, Response):
                return e
            # Check if it's a 404 (batch not found)
            if 'not found' in str(e).lower() or 'does not exist' in str(e).lower():
                return Response({
                    'error': 'Batch not found',
                    'message': f'Batch with ID {batch_id} does not exist or you do not have access to it.'
                }, status=status.HTTP_404_NOT_FOUND)
            # Re-raise other exceptions
            raise
        
        # Get audit logs for this batch
        from .models import AuditLog
        audit_logs = AuditLog.objects.filter(batch=batch).order_by('timestamp')
        
        # Build journey steps from audit logs and batch data
        journey_steps = []
        
        # Step 1: Batch Created
        if batch.created_at:
            journey_steps.append({
                'id': 1,
                'title': 'Batch Created',
                'location': batch.producer_name or 'Unknown Producer',
                'date': batch.created_at.strftime('%b %d, %Y'),
                'verified': False,
                'action': 'create',
                'user': batch.created_by.email if batch.created_by else 'System',
                'timestamp': batch.created_at.isoformat(),
            })
        
        # Step 2: Lab Tests
        lab_tests = batch.lab_tests.all().order_by('test_date', 'created_at')
        for idx, test in enumerate(lab_tests, start=2):
            journey_steps.append({
                'id': len(journey_steps) + 1,
                'title': f'Lab Test: {test.test_type}',
                'location': test.tested_by or 'Unknown Lab',
                'date': test.test_date.strftime('%b %d, %Y') if test.test_date else test.created_at.strftime('%b %d, %Y'),
                'verified': bool(test.blockchain_tx_hash),
                'action': 'lab_test',
                'user': test.created_by.email if test.created_by else 'System',
                'blockchain_tx_hash': test.blockchain_tx_hash,
                'timestamp': (test.test_date or test.created_at).isoformat() if test.test_date or test.created_at else None,
            })
        
        # Step 3: Certificate
        try:
            cert = batch.certificate
            journey_steps.append({
                'id': len(journey_steps) + 1,
                'title': 'Certificate Issued',
                'location': cert.issued_by or 'Unknown Authority',
                'date': cert.issue_date.strftime('%b %d, %Y') if cert.issue_date else cert.created_at.strftime('%b %d, %Y'),
                'verified': bool(cert.blockchain_tx_hash),
                'action': 'certificate',
                'user': cert.created_by.email if cert.created_by else 'System',
                'blockchain_tx_hash': cert.blockchain_tx_hash,
                'timestamp': (cert.issue_date or cert.created_at).isoformat() if cert.issue_date or cert.created_at else None,
            })
        except Certificate.DoesNotExist:
            pass
        
        # Step 4: Blockchain Recording
        if batch.blockchain_tx_hash:
            blockchain_log = audit_logs.filter(action='record_blockchain').first()
            journey_steps.append({
                'id': len(journey_steps) + 1,
                'title': 'Recorded on Blockchain',
                'location': 'Ethereum Blockchain',
                'date': blockchain_log.timestamp.strftime('%b %d, %Y') if blockchain_log else batch.updated_at.strftime('%b %d, %Y'),
                'verified': True,
                'action': 'record_blockchain',
                'user': blockchain_log.user_email if blockchain_log else 'System',
                'blockchain_tx_hash': batch.blockchain_tx_hash,
                'timestamp': (blockchain_log.timestamp if blockchain_log else batch.updated_at).isoformat(),
            })
        
        # Get full audit trail
        audit_trail = []
        for log in audit_logs:
            audit_trail.append({
                'id': log.id,
                'action': log.action,
                'action_description': log.action_description,
                'user': log.user_email,
                'user_id': log.user.id if log.user else None,
                'timestamp': log.timestamp.isoformat(),
                'blockchain_tx_hash': log.blockchain_tx_hash,
                'old_values': log.old_values,
                'new_values': log.new_values,
                'ip_address': str(log.ip_address) if log.ip_address else None,
            })
        
        return Response({
            'batch_id': batch.batch_id,
            'journey_steps': journey_steps,
            'audit_trail': audit_trail,
            'total_steps': len(journey_steps),
            'verified_steps': sum(1 for step in journey_steps if step.get('verified', False)),
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='statistics', permission_classes=[AllowAny])
    def statistics(self, request):
        """Get statistics about batches, verification, and producers."""
        try:
            # Total batches
            total_batches = Batch.objects.count()
            
            # Verified batches (with blockchain_tx_hash)
            verified_batches = Batch.objects.filter(blockchain_tx_hash__isnull=False).count()
            
            # Calculate verified percentage
            verified_percentage = round((verified_batches / total_batches * 100) if total_batches > 0 else 0, 1)
            
            # Unique producers/beekeepers
            unique_producers = Batch.objects.values('producer_name').distinct().count()
            
            # Total lab tests
            total_lab_tests = LabTest.objects.count()
            
            # Verified lab tests
            verified_lab_tests = LabTest.objects.filter(blockchain_tx_hash__isnull=False).count()
            
            # Total certificates
            total_certificates = Certificate.objects.count()
            
            # Verified certificates
            verified_certificates = Certificate.objects.filter(blockchain_tx_hash__isnull=False).count()
            
            return Response({
                'total_batches': total_batches,
                'verified_batches': verified_batches,
                'verified_percentage': verified_percentage,
                'unique_producers': unique_producers,
                'total_lab_tests': total_lab_tests,
                'verified_lab_tests': verified_lab_tests,
                'total_certificates': total_certificates,
                'verified_certificates': verified_certificates,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error calculating statistics: {str(e)}")
            return Response({
                'error': str(e),
                'message': 'Failed to calculate statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LabTestViewSet(viewsets.ModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Filter lab tests by batch if batch parameter is provided."""
        queryset = LabTest.objects.all()
        batch_id = self.request.query_params.get('batch', None)
        if batch_id is not None:
            queryset = queryset.filter(batch_id=batch_id)
        return queryset

    def create(self, request, *args, **kwargs):
        """Create lab test and record on blockchain."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Set ownership - pass user field directly to save()
        user = request.user if request.user.is_authenticated else None

        # Save to local database first with ownership
        lab_test = serializer.save(created_by=user)
        
        # Log audit trail
        log_audit_action(
            action='create',
            user=user,
            lab_test=lab_test,
            batch=lab_test.batch,
            action_description=f"Created lab test {lab_test.test_type} for batch {lab_test.batch.batch_id}",
            new_values={
                'test_type': lab_test.test_type,
                'tested_by': lab_test.tested_by,
                'test_date': str(lab_test.test_date),
                'result': lab_test.result[:100],  # Truncate for storage
            },
            request=request
        )

        # Create result string from lab test data for blockchain
        # Smart contract stores: testId, batchId, result
        # Combine all test data into result string since contract only stores result as string
        result_string = f"Type: {lab_test.test_type} | Result: {lab_test.result} | Tested by: {lab_test.tested_by} | Date: {lab_test.test_date}"

        # Generate unique test ID (use database ID)
        test_id = f"TEST-{lab_test.id}"

        # Write to blockchain with transaction verification
        try:
            tx_hash = add_lab_test_to_chain(
                test_id=test_id,
                batch_id=lab_test.batch.batch_id,
                result=result_string
            )
            logger.info(f"Lab test {lab_test.id} recorded on-chain: {tx_hash}")

            # Update lab test with blockchain transaction hash
            lab_test.blockchain_tx_hash = tx_hash
            lab_test.save()

            # Include blockchain reference in response
            data = serializer.data
            data["blockchain_tx_hash"] = tx_hash

            headers = self.get_success_headers(serializer.data)
            return Response(data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            logger.error(f"Blockchain error: {str(e)}")
            # Lab test is already saved to database, but blockchain write failed
            # Return success with warning about blockchain
            data = serializer.data
            data["blockchain_tx_hash"] = None
            data["blockchain_warning"] = f"Lab test saved to database but blockchain write failed: {str(e)}"
            
            return Response(
                data,
                status=status.HTTP_201_CREATED
            )

    @action(detail=True, methods=['post'], url_path='record-on-chain')
    def record_on_chain(self, request, pk=None):
        """Record an existing lab test on the blockchain."""
        lab_test = self.get_object()
        
        # Check if already recorded
        if lab_test.blockchain_tx_hash:
            return Response({
                'message': 'Lab test already recorded on blockchain',
                'blockchain_tx_hash': lab_test.blockchain_tx_hash
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
        
        # Create result string from lab test data
        result_string = f"Type: {lab_test.test_type} | Result: {lab_test.result} | Tested by: {lab_test.tested_by} | Date: {lab_test.test_date}"
        test_id = f"TEST-{lab_test.id}"
        
        try:
            # Record on blockchain
            tx_hash = add_lab_test_to_chain(
                test_id=test_id,
                batch_id=lab_test.batch.batch_id,
                result=result_string
            )
            logger.info(f"Lab test {lab_test.id} recorded on-chain: {tx_hash}")
            
            # Update lab test with blockchain transaction hash
            lab_test.blockchain_tx_hash = tx_hash
            lab_test.save()
            
            serializer = self.get_serializer(lab_test)
            return Response({
                'message': 'Lab test recorded on blockchain successfully',
                'blockchain_tx_hash': tx_hash,
                'lab_test': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Blockchain error recording lab test {lab_test.id}: {error_msg}")
            
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

    @action(detail=False, methods=['get'], url_path='verify-test/(?P<test_id>[^/.]+)')
    def verify_test_from_blockchain(self, request, test_id=None):
        """Read lab test data from blockchain via backend (no wallet needed)."""
        try:
            blockchain_data = get_lab_test_from_chain(test_id)
            
            if blockchain_data:
                return Response({
                    'found': True,
                    'data': blockchain_data,
                    'message': 'Lab test found on blockchain'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'found': False,
                    'message': 'Lab test not found on blockchain'
                }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error reading lab test from blockchain: {str(e)}")
            return Response({
                'found': False,
                'error': str(e),
                'message': 'Failed to read lab test from blockchain'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='test-blockchain-connection')
    def test_blockchain_connection(self, request):
        """Test blockchain connection for lab tests."""
        result = test_connection()
        
        if result.get('connected'):
            return Response({
                'connected': True,
                'chain_id': result.get('chain_id'),
                'block_number': result.get('block_number'),
                'rpc_url': result.get('rpc_url'),
                'message': 'Blockchain connection successful'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'connected': False,
                'error': result.get('error'),
                'rpc_url': result.get('rpc_url'),
                'message': 'Cannot connect to blockchain node'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter certificates based on user permissions."""
        user = self.request.user
        
        if not user.is_authenticated:
            return Certificate.objects.none()
        
        queryset = Certificate.objects.all()
        
        # Filter by batch if batch parameter is provided
        batch_id = self.request.query_params.get('batch', None)
        if batch_id is not None:
            queryset = queryset.filter(batch_id=batch_id)
        
        # Admins see all certificates
        if user.is_staff or user.is_superuser:
            return queryset
        
        # Regular users see only certificates for their batches
        return queryset.filter(
            models.Q(batch__created_by=user) | models.Q(batch__owner=user) | models.Q(created_by=user)
        )

    def create(self, request, *args, **kwargs):
        """Create certificate and record on blockchain."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Set ownership - pass user field directly to save()
        user = request.user if request.user.is_authenticated else None

        # Save to local database first with ownership
        certificate = serializer.save(created_by=user)
        
        # Log audit trail
        log_audit_action(
            action='create',
            user=user,
            certificate=certificate,
            batch=certificate.batch,
            action_description=f"Created certificate {certificate.certificate_id} for batch {certificate.batch.batch_id}",
            new_values={
                'certificate_id': certificate.certificate_id,
                'issued_by': certificate.issued_by,
                'issue_date': str(certificate.issue_date),
                'expiry_date': str(certificate.expiry_date),
            },
            request=request
        )

        # Create issuer string from certificate data for blockchain
        # Smart contract stores: certId, batchId, issuer
        issuer_string = f"{certificate.issued_by} - Issued: {certificate.issue_date} - Expires: {certificate.expiry_date}"

        # Generate unique cert ID (use certificate_id from database)
        cert_id = certificate.certificate_id

        # Write to blockchain with transaction verification
        try:
            tx_hash = issue_certificate_on_chain(
                cert_id=cert_id,
                batch_id=certificate.batch.batch_id,
                issuer=issuer_string
            )
            logger.info(f"Certificate {certificate.id} recorded on-chain: {tx_hash}")

            # Update certificate with blockchain transaction hash
            certificate.blockchain_tx_hash = tx_hash
            certificate.save()

            # Include blockchain reference in response
            data = serializer.data
            data["blockchain_tx_hash"] = tx_hash

            headers = self.get_success_headers(serializer.data)
            return Response(data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            logger.error(f"Blockchain error: {str(e)}")
            # Certificate is already saved to database, but blockchain write failed
            # Return success with warning about blockchain
            data = serializer.data
            data["blockchain_tx_hash"] = None
            data["blockchain_warning"] = f"Certificate saved to database but blockchain write failed: {str(e)}"
            
            return Response(
                data,
                status=status.HTTP_201_CREATED
            )

    @action(detail=True, methods=['post'], url_path='record-on-chain')
    def record_on_chain(self, request, pk=None):
        """Record an existing certificate on the blockchain."""
        certificate = self.get_object()
        
        # Check if already recorded
        if certificate.blockchain_tx_hash:
            return Response({
                'message': 'Certificate already recorded on blockchain',
                'blockchain_tx_hash': certificate.blockchain_tx_hash
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
        
        # Create issuer string from certificate data
        issuer_string = f"{certificate.issued_by} - Issued: {certificate.issue_date} - Expires: {certificate.expiry_date}"
        cert_id = certificate.certificate_id
        
        try:
            # Record on blockchain
            tx_hash = issue_certificate_on_chain(
                cert_id=cert_id,
                batch_id=certificate.batch.batch_id,
                issuer=issuer_string
            )
            logger.info(f"Certificate {certificate.id} recorded on-chain: {tx_hash}")
            
            # Update certificate with blockchain transaction hash
            old_tx_hash = certificate.blockchain_tx_hash
            certificate.blockchain_tx_hash = tx_hash
            certificate.save()
            
            # Log audit trail
            log_audit_action(
                action='record_blockchain',
                user=request.user if request.user.is_authenticated else None,
                certificate=certificate,
                batch=certificate.batch,
                action_description=f"Recorded certificate {certificate.certificate_id} on blockchain",
                blockchain_tx_hash=tx_hash,
                old_values={'blockchain_tx_hash': old_tx_hash} if old_tx_hash else None,
                new_values={'blockchain_tx_hash': tx_hash},
                request=request
            )
            
            serializer = self.get_serializer(certificate)
            return Response({
                'message': 'Certificate recorded on blockchain successfully',
                'blockchain_tx_hash': tx_hash,
                'certificate': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Blockchain error recording certificate {certificate.id}: {error_msg}")
            
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

    @action(detail=False, methods=['get'], url_path='verify-certificate/(?P<cert_id>[^/.]+)')
    def verify_certificate_from_blockchain(self, request, cert_id=None):
        """Read certificate data from blockchain via backend (no wallet needed)."""
        try:
            blockchain_data = get_certificate_from_chain(cert_id)
            
            if blockchain_data:
                return Response({
                    'found': True,
                    'data': blockchain_data,
                    'message': 'Certificate found on blockchain'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'found': False,
                    'message': 'Certificate not found on blockchain'
                }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error reading certificate from blockchain: {str(e)}")
            return Response({
                'found': False,
                'error': str(e),
                'message': 'Failed to read certificate from blockchain'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='test-blockchain-connection')
    def test_blockchain_connection(self, request):
        """Test blockchain connection for certificates."""
        result = test_connection()
        
        if result.get('connected'):
            return Response({
                'connected': True,
                'chain_id': result.get('chain_id'),
                'block_number': result.get('block_number'),
                'rpc_url': result.get('rpc_url'),
                'message': 'Blockchain connection successful'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'connected': False,
                'error': result.get('error'),
                'rpc_url': result.get('rpc_url'),
                'message': 'Cannot connect to blockchain node'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
