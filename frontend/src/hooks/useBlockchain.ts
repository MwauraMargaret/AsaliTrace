import { useWeb3 } from '@/contexts/Web3Context';
import { 
  readBatch, 
  createBatchOnChain,
  readLabTest,
  readCertificate,
  addLabTestOnChain,
  issueCertificateOnChain,
} from '@/services/contract';
import { useState } from 'react';

export const useBlockchain = () => {
  const { signer, provider, isConnected, hardhatConnected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyBatch = async (batchId: string) => {
    // Check if we have a provider (Hardhat or MetaMask)
    if (!provider && !hardhatConnected) {
      throw new Error('Not connected to blockchain. Please connect to Hardhat or MetaMask.');
    }

    setLoading(true);
    setError(null);
    
    try {
      // Use provider for read operations (works with both Hardhat and MetaMask)
      const signerOrProvider = signer || provider;
      if (!signerOrProvider) {
        throw new Error('No signer or provider available');
      }
      
      const batchData = await readBatch(signerOrProvider, batchId);
      return batchData;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to read batch from blockchain';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async (batchId: string, description: string) => {
    if (!signer) {
      throw new Error('No signer available. Please connect to Hardhat or MetaMask to create batches on blockchain.');
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await createBatchOnChain(signer, batchId, description);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create batch on blockchain';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyLabTest = async (testId: string) => {
    if (!provider && !hardhatConnected) {
      throw new Error('Not connected to blockchain');
    }

    setLoading(true);
    setError(null);
    
    try {
      const signerOrProvider = signer || provider;
      if (!signerOrProvider) {
        throw new Error('No signer or provider available');
      }
      
      const testData = await readLabTest(signerOrProvider, testId);
      return testData;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to read lab test from blockchain';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyCertificate = async (certId: string) => {
    if (!provider && !hardhatConnected) {
      throw new Error('Not connected to blockchain');
    }

    setLoading(true);
    setError(null);
    
    try {
      const signerOrProvider = signer || provider;
      if (!signerOrProvider) {
        throw new Error('No signer or provider available');
      }
      
      const certData = await readCertificate(signerOrProvider, certId);
      return certData;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to read certificate from blockchain';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addLabTest = async (testId: string, batchId: string, result: string) => {
    if (!signer) {
      throw new Error('No signer available. Please connect to Hardhat or MetaMask.');
    }

    setLoading(true);
    setError(null);
    
    try {
      const result_data = await addLabTestOnChain(signer, testId, batchId, result);
      return result_data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add lab test on blockchain';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const issueCertificate = async (certId: string, batchId: string, issuer: string) => {
    if (!signer) {
      throw new Error('No signer available. Please connect to Hardhat or MetaMask.');
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await issueCertificateOnChain(signer, certId, batchId, issuer);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to issue certificate on blockchain';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    verifyBatch,
    createBatch,
    verifyLabTest,
    verifyCertificate,
    addLabTest,
    issueCertificate,
    loading,
    error,
    isConnected,
  };
};

