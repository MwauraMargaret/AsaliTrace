from web3 import Web3
import json, os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# --- Load environment variables ---
RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
PUBLIC_ADDRESS = os.getenv("PUBLIC_ADDRESS")

# Lazy initialization - don't connect at module import time
_web3 = None
_contract = None


def get_web3():
    """Lazy initialization of Web3 connection with error handling."""
    global _web3
    if _web3 is None:
        try:
            # Create provider - Web3.py v7 handles headers automatically
            # Use minimal request_kwargs to avoid JSON-RPC parse errors
            provider = Web3.HTTPProvider(
                RPC_URL,
                request_kwargs={
                    'timeout': 30,
                }
            )
            _web3 = Web3(provider)
            
            # Test connection with a simple call that doesn't require contract
            try:
                # Use a simple RPC call to test connection
                # This is more reliable than chain_id in some cases
                block_number = _web3.eth.block_number
                chain_id = _web3.eth.chain_id
                logger.info(f"Connected to blockchain node at {RPC_URL} (Chain ID: {chain_id}, Block: {block_number})")
            except Exception as conn_error:
                # Log the full error for debugging
                error_details = str(conn_error)
                logger.error(f"Connection test failed: {error_details}")
                
                # Check if it's a JSON-RPC parse error
                if "Parse error" in error_details or "Unexpected end of JSON" in error_details:
                    error_msg = (
                        f"JSON-RPC parse error connecting to {RPC_URL}. "
                        f"This usually means the Hardhat node is not properly responding. "
                        f"Please verify: 1) Hardhat node is running (npx hardhat node), "
                        f"2) Node is accessible at {RPC_URL}, 3) No other process is using port 8545."
                    )
                else:
                    error_msg = (
                        f"Cannot connect to blockchain node at {RPC_URL}. "
                        f"Error: {error_details}. "
                        f"Make sure Hardhat node is running: 'npx hardhat node'"
                    )
                logger.error(error_msg)
                raise Exception(error_msg)
                
        except Exception as e:
            error_msg = f"Blockchain connection failed: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    return _web3


def get_contract():
    """Lazy initialization of contract instance with error handling."""
    global _contract
    if _contract is None:
        if not CONTRACT_ADDRESS:
            raise ValueError("CONTRACT_ADDRESS environment variable not set")
        
        try:
            # Load ABI
            ABI_PATH = os.path.join(settings.BASE_DIR, "../frontend/src/artifacts/contracts/AsaliTrace.sol/AsaliTrace.json")
            if not os.path.exists(ABI_PATH):
                raise FileNotFoundError(f"Contract ABI not found at {ABI_PATH}")
            
            with open(ABI_PATH) as f:
                contract_json = json.load(f)
            
            web3 = get_web3()
            _contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=contract_json["abi"])
            logger.info(f"Contract instance created at address {CONTRACT_ADDRESS}")
        except Exception as e:
            logger.error(f"Failed to initialize contract: {str(e)}")
            raise
    return _contract


def add_batch_to_chain(batch_id, description):
    """
    Send transaction to record a batch on the blockchain.
    Returns transaction hash and waits for receipt.
    """
    try:
        # Check environment variables first
        if not PRIVATE_KEY:
            raise ValueError("PRIVATE_KEY environment variable is not set. Please set it in your .env file.")
        if not PUBLIC_ADDRESS:
            raise ValueError("PUBLIC_ADDRESS environment variable is not set. Please set it in your .env file.")
        if not CONTRACT_ADDRESS:
            raise ValueError("CONTRACT_ADDRESS environment variable is not set. Please deploy the contract first and set it in your .env file.")
        
        # Test connection first
        web3 = get_web3()
        
        # Verify we can get block number (connection test)
        try:
            block_number = web3.eth.block_number
            logger.info(f"Connection verified. Current block: {block_number}")
        except Exception as conn_test_error:
            raise Exception(
                f"Cannot communicate with blockchain node at {RPC_URL}. "
                f"Error: {str(conn_test_error)}. "
                f"Please verify: 1) Hardhat node is running (npx hardhat node), "
                f"2) RPC URL is correct ({RPC_URL}), 3) No firewall blocking the connection."
            )
        
        contract = get_contract()
        
        # Get nonce
        nonce = web3.eth.get_transaction_count(PUBLIC_ADDRESS)
        
        # Build transaction
        tx = contract.functions.createBatch(batch_id, description).build_transaction({
            "from": PUBLIC_ADDRESS,
            "nonce": nonce,
            "gas": 3000000,
            "gasPrice": web3.to_wei("5", "gwei")
        })
        
        # Sign transaction
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        
        # Send transaction
        # eth-account v0.13.0+ uses raw_transaction (snake_case)
        # Older versions use rawTransaction (camelCase)
        # Check for raw_transaction first (newer versions)
        if hasattr(signed_tx, 'raw_transaction'):
            raw_tx = signed_tx.raw_transaction
        elif hasattr(signed_tx, 'rawTransaction'):
            raw_tx = signed_tx.rawTransaction
        else:
            raise ValueError(
                "Cannot find raw transaction attribute. "
                "SignedTransaction object has neither 'raw_transaction' nor 'rawTransaction'. "
                "Please check eth-account library version."
            )
        
        tx_hash = web3.eth.send_raw_transaction(raw_tx)
        tx_hash_hex = web3.to_hex(tx_hash)
        
        logger.info(f"Transaction sent: {tx_hash_hex}")
        
        # Wait for transaction receipt (with timeout)
        try:
            receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status != 1:
                error_msg = f"Transaction failed with status {receipt.status}. Transaction hash: {tx_hash_hex}"
                logger.error(error_msg)
                # Try to get revert reason if available
                try:
                    tx = web3.eth.get_transaction(tx_hash)
                    # Try to decode revert reason
                    logger.error(f"Transaction details: {tx}")
                except:
                    pass
                raise Exception(error_msg)
            
            logger.info(f"Transaction confirmed in block {receipt.blockNumber}")
            
            # Verify the batch was actually created by reading it back
            try:
                created_batch = contract.functions.getBatch(batch_id).call()
                if not created_batch or len(created_batch) < 4 or not created_batch[0]:
                    logger.warning(f"Transaction succeeded but batch {batch_id} not found on blockchain after creation")
                    raise Exception(f"Transaction succeeded but batch {batch_id} was not created. This may indicate a contract issue.")
                logger.info(f"Verified: Batch {batch_id} exists on blockchain")
            except Exception as verify_err:
                error_msg = str(verify_err)
                if 'not found' in error_msg.lower() or 'timestamp' in error_msg.lower():
                    logger.error(f"Transaction succeeded but batch verification failed: {error_msg}")
                    raise Exception(f"Transaction succeeded but batch {batch_id} was not created on blockchain. Error: {error_msg}")
                # If it's a different error (like connection issue), log but don't fail
                logger.warning(f"Could not verify batch creation: {error_msg}")
            
            return tx_hash_hex
            
        except Exception as e:
            # If it's already an Exception we raised, re-raise it
            if isinstance(e, Exception) and "Transaction failed" in str(e):
                raise
            logger.error(f"Error waiting for transaction receipt: {str(e)}")
            # Return hash anyway so it can be checked later, but log warning
            logger.warning(f"Transaction hash {tx_hash_hex} returned but receipt verification failed. Batch may not have been created.")
            return tx_hash_hex
            
    except Exception as e:
        logger.error(f"Blockchain transaction failed: {str(e)}")
        raise


def get_batch_from_chain(batch_id):
    """
    Read batch data from blockchain.
    Returns batch data or None if not found.
    """
    try:
        # First check if we can connect to blockchain
        web3 = get_web3()
        contract = get_contract()
        
        # Try to read batch from contract
        try:
            batch = contract.functions.getBatch(batch_id).call()
        except Exception as call_err:
            error_msg = str(call_err).lower()
            # Handle connection/contract deployment errors
            if 'could not transact' in error_msg or 'is contract deployed' in error_msg or 'chain synced' in error_msg:
                logger.error(f"Blockchain connection/contract issue: {call_err}")
                raise Exception(f"Cannot connect to contract. Please verify: 1) Hardhat node is running (npx hardhat node), 2) Contract is deployed, 3) CONTRACT_ADDRESS is correct. Error: {call_err}")
            # Handle "Batch not found" revert from smart contract
            # The contract has: require(batches[_batchId].timestamp != 0, "Batch not found");
            if 'not found' in error_msg or 'timestamp' in error_msg or 'require' in error_msg:
                logger.info(f"Batch {batch_id} not found on blockchain (contract revert: {call_err})")
                return None
            # Handle decode errors
            if 'could not decode' in error_msg or 'value="0x"' in error_msg or 'bad_data' in error_msg:
                logger.info(f"Batch {batch_id} not found on blockchain (decode error: {call_err})")
                return None
            # Re-raise other errors
            raise
        
        # Check if batch exists (empty string or zero address means not found)
        if not batch or len(batch) < 4:
            logger.warning(f"Batch {batch_id} returned empty or invalid data from blockchain")
            return None
        
        batch_id_result = batch[0]
        # Check if batchId is empty or zero (means batch doesn't exist)
        if not batch_id_result or batch_id_result == '':
            logger.info(f"Batch {batch_id} not found on blockchain (empty batchId)")
            return None
        
        # Verify the returned batchId matches what we're looking for (case-insensitive)
        if isinstance(batch_id_result, str) and batch_id_result.lower() != batch_id.lower():
            logger.warning(f"Batch ID mismatch: requested {batch_id}, got {batch_id_result}")
            # Still return it, but log the warning
        
        return {
            'batchId': batch_id_result,
            'description': batch[1] if len(batch) > 1 else '',
            'timestamp': batch[2] if len(batch) > 2 else 0,
            'createdBy': batch[3] if len(batch) > 3 else '',
        }
    except Exception as e:
        error_msg = str(e).lower()
        # Handle specific error cases
        if 'not found' in error_msg or 'could not decode' in error_msg or 'value="0x"' in error_msg or 'bad_data' in error_msg:
            logger.info(f"Batch {batch_id} not found on blockchain")
            return None
        logger.error(f"Error reading batch {batch_id} from blockchain: {str(e)}")
        return None


def add_lab_test_to_chain(test_id, batch_id, result):
    """
    Send transaction to record a lab test on the blockchain.
    Returns transaction hash and waits for receipt.
    """
    try:
        # Check environment variables first
        if not PRIVATE_KEY:
            raise ValueError("PRIVATE_KEY environment variable is not set. Please set it in your .env file.")
        if not PUBLIC_ADDRESS:
            raise ValueError("PUBLIC_ADDRESS environment variable is not set. Please set it in your .env file.")
        if not CONTRACT_ADDRESS:
            raise ValueError("CONTRACT_ADDRESS environment variable is not set. Please deploy the contract first and set it in your .env file.")
        
        # Test connection first
        web3 = get_web3()
        
        # Verify we can get block number (connection test)
        try:
            block_number = web3.eth.block_number
            logger.info(f"Connection verified. Current block: {block_number}")
        except Exception as conn_test_error:
            raise Exception(
                f"Cannot communicate with blockchain node at {RPC_URL}. "
                f"Error: {str(conn_test_error)}. "
                f"Please verify: 1) Hardhat node is running (npx hardhat node), "
                f"2) RPC URL is correct ({RPC_URL}), 3) No firewall blocking the connection."
            )
        
        contract = get_contract()
        
        # Get nonce
        nonce = web3.eth.get_transaction_count(PUBLIC_ADDRESS)
        
        # Build transaction
        tx = contract.functions.addLabTest(test_id, batch_id, result).build_transaction({
            "from": PUBLIC_ADDRESS,
            "nonce": nonce,
            "gas": 3000000,
            "gasPrice": web3.to_wei("5", "gwei")
        })
        
        # Sign transaction
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        
        # Send transaction
        # eth-account v0.13.0+ uses raw_transaction (snake_case)
        # Older versions use rawTransaction (camelCase)
        if hasattr(signed_tx, 'raw_transaction'):
            raw_tx = signed_tx.raw_transaction
        elif hasattr(signed_tx, 'rawTransaction'):
            raw_tx = signed_tx.rawTransaction
        else:
            raise ValueError(
                "Cannot find raw transaction attribute. "
                "SignedTransaction object has neither 'raw_transaction' nor 'rawTransaction'. "
                "Please check eth-account library version."
            )
        
        tx_hash = web3.eth.send_raw_transaction(raw_tx)
        tx_hash_hex = web3.to_hex(tx_hash)
        
        logger.info(f"Lab test transaction sent: {tx_hash_hex}")
        
        # Wait for transaction receipt (with timeout)
        try:
            receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status != 1:
                error_msg = f"Transaction failed with status {receipt.status}"
                logger.error(error_msg)
                raise Exception(error_msg)
            
            logger.info(f"Lab test transaction confirmed in block {receipt.blockNumber}")
            return tx_hash_hex
            
        except Exception as e:
            logger.error(f"Error waiting for transaction receipt: {str(e)}")
            # Return hash anyway so it can be checked later
            return tx_hash_hex
            
    except Exception as e:
        logger.error(f"Blockchain transaction failed: {str(e)}")
        raise


def get_lab_test_from_chain(test_id):
    """
    Read lab test data from blockchain.
    Returns lab test data or None if not found.
    """
    try:
        contract = get_contract()
        lab_test = contract.functions.getLabTest(test_id).call()
        
        return {
            'testId': lab_test[0],
            'batchId': lab_test[1],
            'result': lab_test[2],
            'timestamp': lab_test[3],
        }
    except Exception as e:
        logger.error(f"Error reading lab test from blockchain: {str(e)}")
        return None


def issue_certificate_on_chain(cert_id, batch_id, issuer):
    """
    Send transaction to issue a certificate on the blockchain.
    Returns transaction hash and waits for receipt.
    """
    try:
        # Check environment variables first
        if not PRIVATE_KEY:
            raise ValueError("PRIVATE_KEY environment variable is not set. Please set it in your .env file.")
        if not PUBLIC_ADDRESS:
            raise ValueError("PUBLIC_ADDRESS environment variable is not set. Please set it in your .env file.")
        if not CONTRACT_ADDRESS:
            raise ValueError("CONTRACT_ADDRESS environment variable is not set. Please deploy the contract first and set it in your .env file.")
        
        # Test connection first
        web3 = get_web3()
        
        # Verify we can get block number (connection test)
        try:
            block_number = web3.eth.block_number
            logger.info(f"Connection verified. Current block: {block_number}")
        except Exception as conn_test_error:
            raise Exception(
                f"Cannot communicate with blockchain node at {RPC_URL}. "
                f"Error: {str(conn_test_error)}. "
                f"Please verify: 1) Hardhat node is running (npx hardhat node), "
                f"2) RPC URL is correct ({RPC_URL}), 3) No firewall blocking the connection."
            )
        
        contract = get_contract()
        
        # Get nonce
        nonce = web3.eth.get_transaction_count(PUBLIC_ADDRESS)
        
        # Build transaction
        tx = contract.functions.issueCertificate(cert_id, batch_id, issuer).build_transaction({
            "from": PUBLIC_ADDRESS,
            "nonce": nonce,
            "gas": 3000000,
            "gasPrice": web3.to_wei("5", "gwei")
        })
        
        # Sign transaction
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        
        # Send transaction
        # eth-account v0.13.0+ uses raw_transaction (snake_case)
        # Older versions use rawTransaction (camelCase)
        if hasattr(signed_tx, 'raw_transaction'):
            raw_tx = signed_tx.raw_transaction
        elif hasattr(signed_tx, 'rawTransaction'):
            raw_tx = signed_tx.rawTransaction
        else:
            raise ValueError(
                "Cannot find raw transaction attribute. "
                "SignedTransaction object has neither 'raw_transaction' nor 'rawTransaction'. "
                "Please check eth-account library version."
            )
        
        tx_hash = web3.eth.send_raw_transaction(raw_tx)
        tx_hash_hex = web3.to_hex(tx_hash)
        
        logger.info(f"Certificate transaction sent: {tx_hash_hex}")
        
        # Wait for transaction receipt (with timeout)
        try:
            receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status != 1:
                error_msg = f"Transaction failed with status {receipt.status}"
                logger.error(error_msg)
                raise Exception(error_msg)
            
            logger.info(f"Certificate transaction confirmed in block {receipt.blockNumber}")
            return tx_hash_hex
            
        except Exception as e:
            logger.error(f"Error waiting for transaction receipt: {str(e)}")
            # Return hash anyway so it can be checked later
            return tx_hash_hex
            
    except Exception as e:
        logger.error(f"Blockchain transaction failed: {str(e)}")
        raise


def get_certificate_from_chain(cert_id):
    """
    Read certificate data from blockchain.
    Returns certificate data or None if not found.
    """
    try:
        contract = get_contract()
        certificate = contract.functions.getCertificate(cert_id).call()
        
        return {
            'certId': certificate[0],
            'batchId': certificate[1],
            'issuer': certificate[2],
            'timestamp': certificate[3],
        }
    except Exception as e:
        logger.error(f"Error reading certificate from blockchain: {str(e)}")
        return None


def test_connection():
    """
    Test blockchain connection without initializing contract.
    Useful for health checks.
    """
    try:
        web3 = get_web3()
        chain_id = web3.eth.chain_id
        block_number = web3.eth.block_number
        return {
            'connected': True,
            'chain_id': chain_id,
            'block_number': block_number,
            'rpc_url': RPC_URL
        }
    except Exception as e:
        return {
            'connected': False,
            'error': str(e),
            'rpc_url': RPC_URL
        }
