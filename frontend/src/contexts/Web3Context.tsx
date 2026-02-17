import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, JsonRpcProvider, JsonRpcSigner, Wallet } from 'ethers';
import { toast } from 'sonner';

// Hardhat local node configuration
const HARDHAT_RPC_URL = import.meta.env.VITE_HARDHAT_RPC_URL || 'http://127.0.0.1:8545';
const HARDHAT_CHAIN_ID = 31337;

interface Web3ContextType {
  // Providers
  provider: BrowserProvider | JsonRpcProvider | null;
  hardhatProvider: JsonRpcProvider | null;
  browserProvider: BrowserProvider | null;
  
  // Signers
  signer: JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  
  // Connection status
  isConnected: boolean;
  isConnecting: boolean;
  hardhatConnected: boolean;
  hardhatConnectionError: string | null;
  
  // Connection methods
  connectWallet: () => Promise<void>;
  connectToHardhat: () => Promise<void>;
  disconnectWallet: () => void;
  
  // Status check
  checkHardhatConnection: () => Promise<boolean>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  // MetaMask/Browser provider
  const [browserProvider, setBrowserProvider] = useState<BrowserProvider | null>(null);
  const [browserSigner, setBrowserSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Hardhat direct connection
  const [hardhatProvider, setHardhatProvider] = useState<JsonRpcProvider | null>(null);
  const [hardhatSigner, setHardhatSigner] = useState<JsonRpcSigner | null>(null);
  const [hardhatConnected, setHardhatConnected] = useState(false);
  const [hardhatConnectionError, setHardhatConnectionError] = useState<string | null>(null);

  // Determine active provider and signer
  const provider = hardhatProvider || browserProvider;
  const signer = hardhatSigner || browserSigner;
  const isConnected = !!account || hardhatConnected;

  // Check Hardhat connection status
  const checkHardhatConnection = async (): Promise<boolean> => {
    try {
      const testProvider = new JsonRpcProvider(HARDHAT_RPC_URL);
      const network = await testProvider.getNetwork();
      const blockNumber = await testProvider.getBlockNumber();
      
      // Verify it's the correct chain
      if (Number(network.chainId) === HARDHAT_CHAIN_ID) {
        setHardhatConnectionError(null);
        return true;
      } else {
        setHardhatConnectionError(`Wrong chain ID. Expected ${HARDHAT_CHAIN_ID}, got ${network.chainId}`);
        return false;
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to connect to Hardhat node';
      setHardhatConnectionError(errorMsg);
      console.error('Hardhat connection check failed:', error);
      return false;
    }
  };

  // Connect directly to Hardhat node
  const connectToHardhat = async () => {
    try {
      setIsConnecting(true);
      setHardhatConnectionError(null);
      
      // Create JsonRpcProvider for Hardhat
      const provider = new JsonRpcProvider(HARDHAT_RPC_URL);
      
      // Test connection
      const isConnected = await checkHardhatConnection();
      if (!isConnected) {
        throw new Error(hardhatConnectionError || 'Failed to connect to Hardhat node');
      }
      
      // Get network info
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      
      // Use the first account from Hardhat (for read-only operations)
      // For write operations, you'd need to import a private key
      const signer = await provider.getSigner(0);
      const signerAddress = await signer.getAddress();
      
      setHardhatProvider(provider);
      setHardhatSigner(signer);
      setAccount(signerAddress);
      setChainId(Number(network.chainId));
      setHardhatConnected(true);
      
      toast.success(`Connected to Hardhat (Chain ID: ${network.chainId}, Block: ${blockNumber})`);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to connect to Hardhat node';
      setHardhatConnectionError(errorMsg);
      setHardhatConnected(false);
      toast.error(`Hardhat connection failed: ${errorMsg}`);
      console.error('Failed to connect to Hardhat:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect via MetaMask/Browser wallet
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('Please install MetaMask to use blockchain features');
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const web3Signer = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      setBrowserProvider(browserProvider);
      setBrowserSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      toast.success('Wallet connected successfully');
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setBrowserProvider(null);
    setBrowserSigner(null);
    setHardhatProvider(null);
    setHardhatSigner(null);
    setAccount(null);
    setChainId(null);
    setHardhatConnected(false);
    setHardhatConnectionError(null);
    toast.success('Disconnected');
  };

  // Auto-connect to Hardhat on mount
  useEffect(() => {
    const autoConnectHardhat = async () => {
      try {
        const connected = await checkHardhatConnection();
        if (connected) {
          // Auto-connect if Hardhat is available
          await connectToHardhat();
        }
      } catch (error) {
        // Silently fail - Hardhat might not be running
        console.log('Hardhat node not available for auto-connect');
      }
    };

    autoConnectHardhat();
  }, []);

  // MetaMask event listeners
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // Only disconnect browser provider, keep Hardhat if connected
          setBrowserProvider(null);
          setBrowserSigner(null);
          if (!hardhatConnected) {
            setAccount(null);
          }
        } else {
          setAccount(accounts[0]);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (newChainId: string) => {
        setChainId(parseInt(newChainId, 16));
        window.location.reload();
      });

      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0 && !hardhatConnected) {
          connectWallet();
        }
      });
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [hardhatConnected]);

  return (
    <Web3Context.Provider
      value={{
        provider,
        hardhatProvider,
        browserProvider,
        signer,
        account,
        chainId,
        isConnected,
        isConnecting,
        hardhatConnected,
        hardhatConnectionError,
        connectWallet,
        connectToHardhat,
        disconnectWallet,
        checkHardhatConnection,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
