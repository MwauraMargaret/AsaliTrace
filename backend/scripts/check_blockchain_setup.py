#!/usr/bin/env python
"""
Diagnostic script to check blockchain setup.
Run this to verify your blockchain configuration.
"""
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

def check_env_vars():
    """Check if required environment variables are set."""
    print("=" * 60)
    print("BLOCKCHAIN SETUP DIAGNOSTICS")
    print("=" * 60)
    print()
    
    required_vars = {
        'PRIVATE_KEY': os.getenv('PRIVATE_KEY'),
        'PUBLIC_ADDRESS': os.getenv('PUBLIC_ADDRESS'),
        'CONTRACT_ADDRESS': os.getenv('CONTRACT_ADDRESS'),
        'BLOCKCHAIN_RPC_URL': os.getenv('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545'),
    }
    
    print("Environment Variables:")
    print("-" * 60)
    all_set = True
    for var_name, var_value in required_vars.items():
        if var_value:
            if var_name == 'PRIVATE_KEY':
                display_value = f"{var_value[:10]}...{var_value[-6:]}" if len(var_value) > 16 else "***"
            else:
                display_value = var_value
            print(f"  ✓ {var_name}: {display_value}")
        else:
            print(f"  ✗ {var_name}: NOT SET")
            all_set = False
    print()
    
    return all_set, required_vars

def check_abi_file():
    """Check if contract ABI file exists."""
    print("Contract ABI File:")
    print("-" * 60)
    
    from django.conf import settings
    ABI_PATH = os.path.join(settings.BASE_DIR, "../frontend/src/artifacts/contracts/AsaliTrace.sol/AsaliTrace.json")
    
    if os.path.exists(ABI_PATH):
        print(f"  ✓ ABI file found: {ABI_PATH}")
        return True
    else:
        print(f"  ✗ ABI file NOT found: {ABI_PATH}")
        print(f"     Expected location: frontend/src/artifacts/contracts/AsaliTrace.sol/AsaliTrace.json")
        return False

def test_connection():
    """Test connection to Hardhat node."""
    print()
    print("Blockchain Connection Test:")
    print("-" * 60)
    
    try:
        from asalitrace.blockchain.eth_adapter import test_connection
        result = test_connection()
        
        if result.get('connected'):
            print(f"  ✓ Connected to blockchain node")
            print(f"    Chain ID: {result.get('chain_id')}")
            print(f"    Block Number: {result.get('block_number')}")
            print(f"    RPC URL: {result.get('rpc_url')}")
            return True
        else:
            print(f"  ✗ Connection failed")
            print(f"    Error: {result.get('error')}")
            print(f"    RPC URL: {result.get('rpc_url')}")
            print()
            print("  Troubleshooting:")
            print("    1. Make sure Hardhat node is running: npx hardhat node")
            print("    2. Check if port 8545 is accessible")
            print("    3. Verify RPC URL in .env file")
            return False
    except Exception as e:
        print(f"  ✗ Connection test failed: {str(e)}")
        return False

def test_contract():
    """Test contract initialization."""
    print()
    print("Contract Initialization Test:")
    print("-" * 60)
    
    try:
        from asalitrace.blockchain.eth_adapter import get_contract
        contract = get_contract()
        print(f"  ✓ Contract initialized successfully")
        print(f"    Address: {os.getenv('CONTRACT_ADDRESS')}")
        return True
    except Exception as e:
        print(f"  ✗ Contract initialization failed: {str(e)}")
        print()
        print("  Troubleshooting:")
        if "CONTRACT_ADDRESS" in str(e):
            print("    1. Deploy the contract: npx hardhat run scripts/deploy.js --network localhost")
            print("    2. Copy the contract address to .env file")
        elif "ABI" in str(e) or "not found" in str(e):
            print("    1. Compile the contract: npx hardhat compile")
            print("    2. Check if ABI file exists in frontend/src/artifacts/")
        else:
            print(f"    Error: {str(e)}")
        return False

def main():
    """Run all diagnostic checks."""
    # Setup Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asalitrace.settings')
    import django
    django.setup()
    
    print()
    env_ok, env_vars = check_env_vars()
    print()
    
    abi_ok = check_abi_file()
    print()
    
    if not env_ok:
        print("⚠️  Please set all required environment variables in backend/.env")
        print()
    
    if env_ok and abi_ok:
        conn_ok = test_connection()
        if conn_ok:
            test_contract()
    
    print()
    print("=" * 60)
    print("DIAGNOSTICS COMPLETE")
    print("=" * 60)
    print()

if __name__ == '__main__':
    main()

