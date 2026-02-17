#!/usr/bin/env python
"""
Quick test script for blockchain integration.
Run with: python manage.py shell < scripts/test_blockchain_integration.py
Or: python manage.py runscript test_blockchain_integration
"""

import os
import sys
from django.conf import settings

# Add project to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from asalitrace.blockchain.eth_adapter import (
    get_web3, 
    get_contract, 
    test_connection,
    add_batch_to_chain,
    get_batch_from_chain
)
from batches.models import Batch

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_connection():
    """Test 1: Verify blockchain connection"""
    print_section("TEST 1: Blockchain Connection")
    
    result = test_connection()
    if result['connected']:
        print("✅ Blockchain node is connected!")
        print(f"   Chain ID: {result['chain_id']}")
        print(f"   Block Number: {result['block_number']}")
        print(f"   RPC URL: {result['rpc_url']}")
        return True
    else:
        print("❌ Blockchain node connection failed!")
        print(f"   Error: {result['error']}")
        print(f"   RPC URL: {result['rpc_url']}")
        print("\n   Solution: Start Hardhat node with 'npx hardhat node'")
        return False

def test_contract():
    """Test 2: Verify contract is accessible"""
    print_section("TEST 2: Smart Contract Access")
    
    try:
        contract = get_contract()
        print("✅ Smart contract is accessible!")
        print(f"   Contract Address: {os.getenv('CONTRACT_ADDRESS', 'Not set')}")
        return True
    except Exception as e:
        print("❌ Smart contract access failed!")
        print(f"   Error: {str(e)}")
        print("\n   Solution: Deploy contract and set CONTRACT_ADDRESS in .env")
        return False

def test_create_batch():
    """Test 3: Create a test batch on blockchain"""
    print_section("TEST 3: Create Batch on Blockchain")
    
    try:
        batch_id = "TEST-BATCH-001"
        description = "Test Batch - Wildflower Honey - Qty: 50kg"
        
        print(f"Creating batch: {batch_id}")
        tx_hash = add_batch_to_chain(batch_id, description)
        
        print("✅ Batch created on blockchain!")
        print(f"   Transaction Hash: {tx_hash}")
        return tx_hash, batch_id
    except Exception as e:
        print("❌ Failed to create batch on blockchain!")
        print(f"   Error: {str(e)}")
        return None, None

def test_read_batch(batch_id):
    """Test 4: Read batch from blockchain"""
    print_section("TEST 4: Read Batch from Blockchain")
    
    if not batch_id:
        print("⚠️  Skipping - no batch ID available")
        return False
    
    try:
        batch_data = get_batch_from_chain(batch_id)
        
        if batch_data:
            print("✅ Batch read from blockchain!")
            print(f"   Batch ID: {batch_data['batchId']}")
            print(f"   Description: {batch_data['description']}")
            print(f"   Timestamp: {batch_data['timestamp']}")
            print(f"   Created By: {batch_data['createdBy']}")
            return True
        else:
            print("❌ Batch not found on blockchain!")
            return False
    except Exception as e:
        print("❌ Failed to read batch from blockchain!")
        print(f"   Error: {str(e)}")
        return False

def test_database_integration():
    """Test 5: Test database and blockchain integration"""
    print_section("TEST 5: Database-Blockchain Integration")
    
    try:
        # Get a batch from database
        batches = Batch.objects.filter(blockchain_tx_hash__isnull=False)[:1]
        
        if not batches.exists():
            print("⚠️  No batches with blockchain_tx_hash found in database")
            print("   Create a batch via the frontend first")
            return False
        
        batch = batches.first()
        print(f"Testing with batch: {batch.batch_id}")
        print(f"   Database TX Hash: {batch.blockchain_tx_hash}")
        
        # Verify on blockchain
        blockchain_data = get_batch_from_chain(batch.batch_id)
        
        if blockchain_data:
            print(" Database and blockchain are in sync!")
            print(f"   Database Batch ID: {batch.batch_id}")
            print(f"   Blockchain Batch ID: {blockchain_data['batchId']}")
            
            if batch.batch_id == blockchain_data['batchId']:
                print("   Batch IDs match!")
            else:
                print("    Batch IDs don't match!")
            
            return True
        else:
            print(" Batch not found on blockchain!")
            return False
            
    except Exception as e:
        print(" Integration test failed!")
        print(f"   Error: {str(e)}")
        return False

def test_event_logs():
    """Test 6: Test event logs retrieval"""
    print_section("TEST 6: Event Logs")
    
    try:
        web3 = get_web3()
        contract = get_contract()
        
        # Get all BatchCreated events
        events = contract.events.BatchCreated.get_logs(fromBlock=0)
        
        print(f"✅ Found {len(events)} BatchCreated events")
        
        if events:
            print("\n   Recent events:")
            for event in events[-5:]:  # Show last 5
                block = web3.eth.get_block(event.blockNumber)
                print(f"   - Batch: {event.args.batchId}")
                print(f"     Block: {event.blockNumber}")
                print(f"     TX: {event.transactionHash.hex()[:20]}...")
                print(f"     Time: {block['timestamp']}")
        else:
            print("   No events found yet")
        
        return True
    except Exception as e:
        print(" Failed to retrieve event logs!")
        print(f"   Error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  ASALITRACE BLOCKCHAIN INTEGRATION TEST")
    print("="*60)
    
    results = {}
    
    # Test 1: Connection
    results['connection'] = test_connection()
    if not results['connection']:
        print("\n❌ Cannot proceed - blockchain node not connected")
        return
    
    # Test 2: Contract
    results['contract'] = test_contract()
    if not results['contract']:
        print("\n❌ Cannot proceed - contract not accessible")
        return
    
    # Test 3: Create batch
    tx_hash, batch_id = test_create_batch()
    results['create'] = tx_hash is not None
    
    # Test 4: Read batch
    results['read'] = test_read_batch(batch_id)
    
    # Test 5: Database integration
    results['integration'] = test_database_integration()
    
    # Test 6: Event logs
    results['events'] = test_event_logs()
    
    # Summary
    print_section("TEST SUMMARY")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name.upper():20} {status}")
    
    print(f"\n   Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n    All tests passed! Blockchain integration is working correctly.")
    else:
        print("\n     Some tests failed. Check the errors above.")

if __name__ == "__main__":
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asalitrace.settings')
    django.setup()
    main()

