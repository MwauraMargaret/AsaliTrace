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
                error_msg = f"Transaction failed with status {receipt.status}"
                logger.error(error_msg)
                raise Exception(error_msg)
            
            logger.info(f"Transaction confirmed in block {receipt.blockNumber}")
            return tx_hash_hex
            
        except Exception as e:
            logger.error(f"Error waiting for transaction receipt: {str(e)}")
            # Return hash anyway so it can be checked later
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
        contract = get_contract()
        batch = contract.functions.getBatch(batch_id).call()
        
        return {
            'batchId': batch[0],
            'description': batch[1],
            'timestamp': batch[2],
            'createdBy': batch[3],
        }
    except Exception as e:
        logger.error(f"Error reading batch from blockchain: {str(e)}")
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
