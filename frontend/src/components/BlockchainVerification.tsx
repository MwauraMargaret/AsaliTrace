import { useState } from "react";
import { getBatchById } from "@/services/api";
import { useBlockchain } from "@/hooks/useBlockchain";
import { useWeb3 } from "@/contexts/Web3Context";
import { toast } from "sonner";

interface BlockchainBatchData {
  batchId: string;
  description: string;
  timestamp: string;
  createdBy: string;
}

export default function BlockchainVerification() {
  const [batchId, setBatchId] = useState("");
  const [result, setResult] = useState<any>(null);
  const { verifyBatch, loading, error } = useBlockchain();
  const { isConnected, connectWallet, isConnecting } = useWeb3();

  const handleVerify = async () => {
    if (!batchId.trim()) {
      toast.error("Please enter a batch ID");
      return;
    }

    if (!isConnected) {
      toast.info("Please connect your wallet to verify on blockchain");
      await connectWallet();
      return;
    }

    try {
      setResult(null);
      
      // Get data from database
      let dbData = null;
      try {
        // Try to get by ID (numeric) first, then by batch_id (string)
        dbData = await getBatchById(batchId);
      } catch (err: any) {
        // If not found by ID, try searching in batches list
        console.warn("Batch not found by ID, trying alternative lookup");
      }

      // Get data from blockchain
      const blockchainData = await verifyBatch(batchId) as BlockchainBatchData | null;

      if (!blockchainData) {
        setResult({
          error: "Batch not found on blockchain",
          verified: false,
          database: dbData,
        });
        toast.error("Batch not found on blockchain");
        return;
      }

      // Compare data
      const isVerified = dbData 
        ? dbData.batch_id === blockchainData.batchId && 
          !!dbData.blockchain_tx_hash // Has blockchain record
        : false;

      setResult({
        database: dbData,
        blockchain: {
          batchId: blockchainData.batchId,
          description: blockchainData.description,
          timestamp: new Date(parseInt(blockchainData.timestamp) * 1000).toLocaleString(),
          createdBy: blockchainData.createdBy,
        },
        verified: isVerified,
        match: isVerified,
      });

      if (isVerified) {
        toast.success("Batch verified on blockchain!");
      } else if (dbData) {
        toast.warning("Batch found but verification incomplete");
      } else {
        toast.info("Batch found on blockchain but not in database");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to verify batch";
      setResult({
        error: errorMessage,
        verified: false,
      });
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Blockchain Verification</h2>
        <p className="text-gray-600 mb-4">
          Verify that a batch exists on the blockchain and matches the database records.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            placeholder="Enter batch ID"
            className="border border-gray-300 p-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleVerify();
              }
            }}
          />
          <button 
            onClick={handleVerify} 
            disabled={loading || isConnecting || !batchId.trim()}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Verifying..." : isConnecting ? "Connecting..." : "Verify"}
          </button>
        </div>

        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
            <p className="font-semibold">Wallet Not Connected</p>
            <p className="text-sm">Please connect your wallet to verify batches on the blockchain.</p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            {result.error ? (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                <h3 className="font-bold mb-2">Verification Failed</h3>
                <p>{result.error}</p>
                {result.database && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold">Database Record:</p>
                    <pre className="bg-white p-2 rounded text-xs overflow-auto mt-1">
                      {JSON.stringify(result.database, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className={`p-4 rounded-lg ${
                  result.verified 
                    ? 'bg-green-50 border border-green-400' 
                    : 'bg-yellow-50 border border-yellow-400'
                }`}>
                  <div className="flex items-center gap-2">
                    {result.verified ? (
                      <>
                        <span className="text-2xl">✅</span>
                        <h3 className="font-bold text-lg text-green-800">Verified on Blockchain</h3>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">⚠️</span>
                        <h3 className="font-bold text-lg text-yellow-800">Verification Incomplete</h3>
                      </>
                    )}
                  </div>
                  <p className="text-sm mt-2">
                    {result.verified 
                      ? "This batch has been verified on the blockchain and matches the database record."
                      : result.database
                        ? "Batch found on blockchain but verification could not be completed."
                        : "Batch found on blockchain but not in database."}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.database && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-bold mb-2 text-gray-800">Database Record</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-semibold">Batch ID:</span> {result.database.batch_id}</p>
                        <p><span className="font-semibold">Producer:</span> {result.database.producer_name}</p>
                        <p><span className="font-semibold">Type:</span> {result.database.honey_type}</p>
                        <p><span className="font-semibold">Quantity:</span> {result.database.quantity} kg</p>
                        <p><span className="font-semibold">Status:</span> {result.database.status}</p>
                        {result.database.blockchain_tx_hash && (
                          <p className="text-xs text-gray-600 break-all">
                            <span className="font-semibold">TX Hash:</span> {result.database.blockchain_tx_hash}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold mb-2 text-gray-800">Blockchain Record</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-semibold">Batch ID:</span> {result.blockchain.batchId}</p>
                      <p><span className="font-semibold">Description:</span> {result.blockchain.description}</p>
                      <p><span className="font-semibold">Created:</span> {result.blockchain.timestamp}</p>
                      <p className="text-xs text-gray-600 break-all">
                        <span className="font-semibold">Creator:</span> {result.blockchain.createdBy}
                      </p>
                    </div>
                  </div>
                </div>

                {result.database && result.blockchain && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h3 className="font-bold mb-2 text-blue-800">Comparison</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-semibold">Batch ID Match:</span>{" "}
                        {result.database.batch_id === result.blockchain.batchId ? "✅ Yes" : "❌ No"}
                      </p>
                      <p>
                        <span className="font-semibold">Has Blockchain TX:</span>{" "}
                        {result.database.blockchain_tx_hash ? "✅ Yes" : "❌ No"}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
