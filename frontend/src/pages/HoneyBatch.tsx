import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BlockchainVerification from "@/components/BlockchainVerification";
import JourneyMap from "@/components/JourneyMap";
//import AIQualityAnalyzer from "@/components/AIQualityAnalyzer";
//import BeekeeperProfile from "@/components/BeekeeperProfile";
//import TrustScore from "@/components/TrustScore";
import { getBatchById, getBatches } from "@/services/api";
import { useBlockchain } from "@/hooks/useBlockchain";
import { useWeb3 } from "@/contexts/Web3Context";
import { toast } from "sonner";
import api from "@/services/api";

interface Batch {
  id?: number;
  batch_id: string;
  producer_name?: string;
  production_date?: string;
  honey_type?: string;
  quantity?: string | number;
  status?: string;
  blockchain_tx_hash?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface BlockchainBatchData {
  batchId: string;
  description: string;
  timestamp: string;
  createdBy: string;
}

const HoneyBatch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockchainData, setBlockchainData] = useState<BlockchainBatchData | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { verifyBatch } = useBlockchain();
  const { isConnected } = useWeb3();

  const trustFactors = [
    "Blockchain records confirmed across all checkpoints",
    "AI purity analysis shows 98% pure wildflower honey",
    "Beekeeper identity verified and certified",
    "No gaps in supply chain tracking",
    "Laboratory test results match on-chain data"
  ];

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (id) fetchBatch(id);
  }, [id]);

  const fetchBatches = async () => {
    try {
      const data = await getBatches();
      setBatches(data);
    } catch (err) {
      console.error("Failed to load batches:", err);
    }
  };

  const fetchBatch = async (batchId: string) => {
    try {
      setLoading(true);
      setError(null);

      let data;
      try {
        data = await getBatchById(batchId);
      } catch {
        const all = await getBatches();
        data = all.find((b: Batch) => b.batch_id === batchId || b.id?.toString() === batchId);
        if (!data) throw new Error("Batch not found");
      }

      setBatch(data);
      if (data.blockchain_tx_hash && isConnected) verifyOnBlockchain(data.batch_id);
    } catch (err: any) {
      setError(err?.message || "Failed to load batch");
    } finally {
      setLoading(false);
    }
  };

  const verifyOnBlockchain = async (batchId: string) => {
    try {
      setVerifying(true);
      const data = await verifyBatch(batchId) as BlockchainBatchData | null;
      setBlockchainData(data);
    } catch (err) {
      console.error("Blockchain verification failed:", err);
    } finally {
      setVerifying(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/batches")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Batches
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/batches")}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{batch?.honey_type || "Honey Batch"}</h1>
                <p className="text-sm text-muted-foreground">
                  Batch #{batch?.batch_id}
                </p>
              </div>
            </div>

            <Button variant="honey">Purchase This Batch</Button>
          </div>

          {/* Dropdown to select other batches */}
          <div className="flex gap-2 items-center mt-2">
            <p className="text-sm text-muted-foreground">View another batch:</p>
            <select
              onChange={(e) => fetchBatch(e.target.value)}
              value={batch?.batch_id}
              className="border border-border rounded-lg px-2 py-1 bg-card text-sm"
            >
              <option value="">Select Batch</option>
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.batch_id} – {b.honey_type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
        {/* Left section */}
        <div className="lg:col-span-2 space-y-8">
          <JourneyMap />
          {/* <AIQualityAnalyzer /> */}
          {/* <BeekeeperProfile /> */}
        </div>

        {/* Right section */}
        <div className="space-y-8">
          {/* <TrustScore score={98} factors={trustFactors} /> */}
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Verification</CardTitle>
              <CardDescription>Confirm on-chain data integrity</CardDescription>
            </CardHeader>
            <CardContent>
              {batch?.blockchain_tx_hash ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <p className="text-sm font-semibold">Blockchain Verified</p>
                  </div>
                  <p className="text-xs break-all">
                    TX Hash: {batch.blockchain_tx_hash}
                  </p>

                  {blockchainData && (
                    <Alert className="mt-2">
                      <AlertDescription>
                        Verified at{" "}
                        {new Date(parseInt(blockchainData.timestamp) * 1000).toLocaleString()}
                      </AlertDescription>
                    </Alert>
                  )}

                  {!blockchainData && isConnected && !verifying && (
                    <Button
                      onClick={() => verifyOnBlockchain(batch.batch_id)}
                      size="sm"
                      variant="outline"
                      className="mt-2"
                    >
                      Verify on Blockchain
                    </Button>
                  )}

                  {verifying && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Verifying...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <XCircle className="w-4 h-4" />
                    <AlertDescription>
                      This batch has not been recorded on the blockchain yet.
                    </AlertDescription>
                  </Alert>
                  
                  {batch && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        You can record this batch on the blockchain to ensure immutability and traceability.
                      </p>
                      <Button
                        onClick={async () => {
                          if (!batch) return;
                          try {
                            // Create description from batch data
                            const description = `${batch.honey_type || 'Honey'} - ${batch.producer_name || 'Unknown'} - Qty: ${batch.quantity || 0}kg`;
                            
                            // Call backend API to record on blockchain
                            const response = await api.post(`/batches/${batch.id || batch.batch_id}/record-on-chain/`, {
                              description,
                            });
                            
                            // Update batch with blockchain tx hash
                            if (response.data.blockchain_tx_hash) {
                              setBatch({ ...batch, blockchain_tx_hash: response.data.blockchain_tx_hash });
                              toast.success(response.data.message || 'Batch recorded on blockchain successfully!');
                            } else if (response.data.message) {
                              toast.info(response.data.message);
                            }
                          } catch (err: any) {
                            const errorData = err?.response?.data;
                            let errorMsg = errorData?.message || errorData?.error || err?.message || 'Failed to record batch on blockchain';
                            
                            // Add details if available
                            if (errorData?.details) {
                              const details = errorData.details;
                              const missing = [];
                              if (!details.has_private_key) missing.push('PRIVATE_KEY');
                              if (!details.has_public_address) missing.push('PUBLIC_ADDRESS');
                              if (!details.has_contract_address) missing.push('CONTRACT_ADDRESS');
                              
                              if (missing.length > 0) {
                                errorMsg += `\nMissing environment variables: ${missing.join(', ')}`;
                              }
                              
                              if (details.rpc_url) {
                                errorMsg += `\nRPC URL: ${details.rpc_url}`;
                              }
                            }
                            
                            toast.error(errorMsg, {
                              duration: 10000, // Show longer for detailed errors
                            });
                          }
                        }}
                        variant="honey"
                        className="w-full"
                        disabled={!batch}
                      >
                        Record on Blockchain
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HoneyBatch;
