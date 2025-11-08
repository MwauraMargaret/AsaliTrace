from web3 import Web3
import json, os
from django.conf import settings

# --- Load environment variables ---
RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
PUBLIC_ADDRESS = os.getenv("PUBLIC_ADDRESS")

# --- Connect to blockchain node ---
web3 = Web3(Web3.HTTPProvider(RPC_URL))
if not web3.is_connected():
    raise Exception(" Web3 provider not connected")

# --- Load contract ABI ---
ABI_PATH = os.path.join(settings.BASE_DIR, "../frontend/src/artifacts/contracts/AsaliTrace.sol/AsaliTrace.json")
with open(ABI_PATH) as f:
    contract_json = json.load(f)
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=contract_json["abi"])


def add_batch_to_chain(batch_id, description):
    """Send transaction to record a batch on the blockchain."""
    nonce = web3.eth.get_transaction_count(PUBLIC_ADDRESS)
    tx = contract.functions.createBatch(batch_id, description).build_transaction({
        "from": PUBLIC_ADDRESS,
        "nonce": nonce,
        "gas": 3000000,
        "gasPrice": web3.to_wei("5", "gwei")
    })
    signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return web3.to_hex(tx_hash)
