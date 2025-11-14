import { Contract } from 'ethers';
import contractABI from '@/artifacts/contracts/AsaliTrace.sol/AsaliTrace.json';

// Get contract address from environment or config
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

/**
 * Get contract instance with signer
 * @param {JsonRpcSigner} signer - Ethers.js signer from Web3Context
 * @returns {Contract} Contract instance
 */
export const getContract = (signer) => {
  if (!signer) {
    throw new Error('Signer is required to interact with contract');
  }
  
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured. Set VITE_CONTRACT_ADDRESS in .env');
  }
  
  if (!contractABI || !contractABI.abi) {
    throw new Error('Contract ABI not found. Make sure contract is compiled.');
  }
  
  return new Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
};

/**
 * Get contract instance for read-only operations (no signer needed)
 * @param {BrowserProvider} provider - Ethers.js provider
 * @returns {Contract} Contract instance
 */
export const getContractReadOnly = (provider) => {
  if (!provider) {
    throw new Error('Provider is required to read from contract');
  }
  
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured. Set VITE_CONTRACT_ADDRESS in .env');
  }
  
  if (!contractABI || !contractABI.abi) {
    throw new Error('Contract ABI not found. Make sure contract is compiled.');
  }
  
  return new Contract(CONTRACT_ADDRESS, contractABI.abi, provider);
};

/**
 * Read batch data from blockchain
 * @param {JsonRpcSigner|BrowserProvider} signerOrProvider - Ethers.js signer or provider
 * @param {string} batchId - Batch ID to read
 * @returns {Promise<Object>} Batch data from blockchain
 */
export const readBatch = async (signerOrProvider, batchId) => {
  let contract;
  
  // Determine if it's a signer or provider
  if (signerOrProvider && 'sendTransaction' in signerOrProvider) {
    // It's a signer
    contract = getContract(signerOrProvider);
  } else {
    // It's a provider
    contract = getContractReadOnly(signerOrProvider);
  }
  
  try {
    const batch = await contract.getBatch(batchId);
    
    // Check if batch exists (empty string or zero address means not found)
    if (!batch || !batch.batchId || batch.batchId === '' || batch.batchId === '0x0000000000000000000000000000000000000000') {
      return null; // Batch not found
    }
    
    return {
      batchId: batch.batchId,
      description: batch.description,
      timestamp: batch.timestamp.toString(),
      createdBy: batch.createdBy,
    };
  } catch (error) {
    // Handle various error types
    if (error.code === 'BAD_DATA' || 
        error.message?.includes('could not decode') ||
        error.message?.includes('Batch not found') ||
        error.message?.includes('value="0x"')) {
      return null; // Batch doesn't exist on blockchain
    }
    throw error;
  }
};

/**
 * Create batch on blockchain (requires user to sign transaction)
 * @param {JsonRpcSigner} signer - Ethers.js signer
 * @param {string} batchId - Batch ID
 * @param {string} description - Batch description
 * @returns {Promise<Object>} Transaction hash and receipt
 */
export const createBatchOnChain = async (signer, batchId, description) => {
  const contract = getContract(signer);
  
  try {
    // Send transaction (user will be prompted to sign in MetaMask)
    const tx = await contract.createBatch(batchId, description);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      hash: tx.hash,
      receipt: receipt,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    // Handle user rejection
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user');
    }
    throw error;
  }
};

/**
 * Read lab test from blockchain
 * @param {JsonRpcSigner|BrowserProvider} signerOrProvider - Ethers.js signer or provider
 * @param {string} testId - Test ID to read
 * @returns {Promise<Object>} Lab test data from blockchain
 */
export const readLabTest = async (signerOrProvider, testId) => {
  let contract;
  
  if (signerOrProvider && 'sendTransaction' in signerOrProvider) {
    contract = getContract(signerOrProvider);
  } else {
    contract = getContractReadOnly(signerOrProvider);
  }
  
  try {
    const test = await contract.getLabTest(testId);
    
    return {
      testId: test.testId,
      batchId: test.batchId,
      result: test.result,
      timestamp: test.timestamp.toString(),
    };
  } catch (error) {
    if (error.message && error.message.includes('Lab test not found')) {
      return null;
    }
    throw error;
  }
};

/**
 * Read certificate from blockchain
 * @param {JsonRpcSigner|BrowserProvider} signerOrProvider - Ethers.js signer or provider
 * @param {string} certId - Certificate ID to read
 * @returns {Promise<Object>} Certificate data from blockchain
 */
export const readCertificate = async (signerOrProvider, certId) => {
  let contract;
  
  if (signerOrProvider && 'sendTransaction' in signerOrProvider) {
    contract = getContract(signerOrProvider);
  } else {
    contract = getContractReadOnly(signerOrProvider);
  }
  
  try {
    const cert = await contract.getCertificate(certId);
    
    return {
      certId: cert.certId,
      batchId: cert.batchId,
      issuer: cert.issuer,
      timestamp: cert.timestamp.toString(),
    };
  } catch (error) {
    if (error.message && error.message.includes('Certificate not found')) {
      return null;
    }
    throw error;
  }
};

/**
 * Add lab test to blockchain (requires user to sign transaction)
 * @param {JsonRpcSigner} signer - Ethers.js signer
 * @param {string} testId - Test ID
 * @param {string} batchId - Batch ID
 * @param {string} result - Test result
 * @returns {Promise<Object>} Transaction hash and receipt
 */
export const addLabTestOnChain = async (signer, testId, batchId, result) => {
  const contract = getContract(signer);
  
  try {
    const tx = await contract.addLabTest(testId, batchId, result);
    const receipt = await tx.wait();
    
    return {
      hash: tx.hash,
      receipt: receipt,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user');
    }
    throw error;
  }
};

/**
 * Issue certificate on blockchain (requires user to sign transaction)
 * @param {JsonRpcSigner} signer - Ethers.js signer
 * @param {string} certId - Certificate ID
 * @param {string} batchId - Batch ID
 * @param {string} issuer - Issuer name
 * @returns {Promise<Object>} Transaction hash and receipt
 */
export const issueCertificateOnChain = async (signer, certId, batchId, issuer) => {
  const contract = getContract(signer);
  
  try {
    const tx = await contract.issueCertificate(certId, batchId, issuer);
    const receipt = await tx.wait();
    
    return {
      hash: tx.hash,
      receipt: receipt,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user');
    }
    throw error;
  }
};

