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
import { getBatchById, getBatches, createLabTest, getLabTests, issueCertificate, getCertificates } from "@/services/api";
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

interface LabTest {
  id?: number;
  batch?: number;
  test_type: string;
  result: string;
  tested_by: string;
  test_date: string;
  blockchain_tx_hash?: string | null;
}

interface Certificate {
  id?: number;
  batch?: number;
  certificate_id: string;
  issued_by: string;
  issue_date: string;
  expiry_date: string;
  blockchain_tx_hash?: string | null;
}

const HoneyBatch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockchainData, setBlockchainData] = useState<BlockchainBatchData | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{connected: boolean; message?: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [showLabTestForm, setShowLabTestForm] = useState(false);
  const [creatingLabTest, setCreatingLabTest] = useState(false);
  const [labTestForm, setLabTestForm] = useState({
    test_type: '',
    result: '',
    tested_by: '',
    test_date: new Date().toISOString().split('T')[0],
  });
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [creatingCertificate, setCreatingCertificate] = useState(false);
  const [certificateForm, setCertificateForm] = useState({
    certificate_id: '',
    issued_by: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
  });
  const { verifyBatch } = useBlockchain();
  const { 
    isConnected, 
    signer, 
    provider, 
    hardhatConnected, 
    hardhatConnectionError,
    isConnecting,
    connectToHardhat,
    checkHardhatConnection 
  } = useWeb3();

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
      
      // Fetch lab tests and certificates for this batch
      if (data.id) {
        try {
          const tests = await getLabTests(data.id);
          setLabTests(tests);
        } catch (err) {
          console.error("Failed to load lab tests:", err);
        }
        try {
          const certs = await getCertificates(data.id);
          setCertificates(certs);
        } catch (err) {
          console.error("Failed to load certificates:", err);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load batch");
    } finally {
      setLoading(false);
    }
  };

  const verifyOnBlockchain = async (batchId: string) => {
    try {
      setVerifying(true);
      
      // Check if batch has blockchain_tx_hash first
      if (!batch?.blockchain_tx_hash) {
        toast.warning('This batch has not been recorded on the blockchain yet. Please record it first.');
        return;
      }
      
      // Try backend API first (no wallet needed)
      try {
        const response = await api.get(`/batches/verify-batch/${batchId}/`);
        if (response.data.found) {
          setBlockchainData({
            batchId: response.data.data.batchId,
            description: response.data.data.description,
            timestamp: response.data.data.timestamp.toString(),
            createdBy: response.data.data.createdBy,
          });
          toast.success('Batch verified on blockchain!');
          return;
        } else {
          // Show detailed error message from backend
          const errorData = response.data;
          let errorMessage = errorData.message || 'Batch not found on blockchain.';
          
          if (errorData.tx_status === 0) {
            errorMessage = `Transaction failed. ${errorData.message}`;
            if (errorData.suggestion) {
              errorMessage += ` ${errorData.suggestion}`;
            }
            toast.error(errorMessage, { duration: 8000 });
          } else if (errorData.tx_status === 1) {
            errorMessage = `Transaction succeeded but batch not found. ${errorData.message}`;
            if (errorData.suggestion) {
              errorMessage += ` ${errorData.suggestion}`;
            }
            toast.warning(errorMessage, { duration: 8000 });
          } else {
            toast.warning(errorMessage, { duration: 6000 });
          }
          return;
        }
      } catch (apiErr: any) {
        // If backend verification fails, try frontend (requires wallet)
        if (isConnected && (signer || provider)) {
          try {
            const data = await verifyBatch(batchId) as BlockchainBatchData | null;
            if (data) {
              setBlockchainData(data);
              toast.success('Batch verified on blockchain!');
              return;
            } else {
              toast.warning('Batch not found on blockchain. It may not have been recorded yet.');
              return;
            }
          } catch (frontendErr: any) {
            // Handle specific error messages
            if (frontendErr.message?.includes('could not decode') || 
                frontendErr.message?.includes('value="0x"') ||
                frontendErr.code === 'BAD_DATA') {
              toast.warning('Batch not found on blockchain. It may not have been recorded yet.');
              return;
            }
            throw frontendErr;
          }
        }
        // If no wallet connection, show helpful message
        if (!isConnected) {
          toast.warning('Batch not found on blockchain. Connect wallet or record batch first.');
          return;
        }
        throw apiErr;
      }
    } catch (err: any) {
      console.error("Blockchain verification failed:", err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to verify batch on blockchain';
      
      // Provide more helpful error messages
      if (errorMsg.includes('could not decode') || errorMsg.includes('value="0x"')) {
        toast.warning('Batch not found on blockchain. It may not have been recorded yet.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setVerifying(false);
    }
  };

  const testBlockchainConnection = async () => {
    try {
      setTestingConnection(true);
      setConnectionStatus(null);
      
      // First try frontend direct connection to Hardhat
      const frontendConnected = await checkHardhatConnection();
      
      if (frontendConnected) {
        // Get network details
        if (provider) {
          try {
            const network = await provider.getNetwork();
            const blockNumber = await provider.getBlockNumber();
            setConnectionStatus({
              connected: true,
              message: `Connected to Hardhat (Chain ID: ${network.chainId}, Block: ${blockNumber})`
            });
            toast.success('Hardhat connection successful!');
            return;
          } catch (err) {
            console.error('Error getting network details:', err);
          }
        }
      }
      
      // Fallback to backend API test
      try {
        const response = await api.get('/batches/test-blockchain-connection/');
        
        if (response.data.status === 'connected') {
          setConnectionStatus({
            connected: true,
            message: `Connected via backend (Chain ID: ${response.data.chain_id}, Block: ${response.data.block_number})`
          });
          toast.success('Blockchain connection successful!');
        } else {
          setConnectionStatus({
            connected: false,
            message: response.data.error || 'Connection failed'
          });
          toast.error('Blockchain connection failed');
        }
      } catch (apiErr: any) {
        const errorMsg = hardhatConnectionError || apiErr?.response?.data?.message || apiErr?.message || 'Failed to test connection';
        setConnectionStatus({
          connected: false,
          message: errorMsg
        });
        toast.error(errorMsg);
      }
    } finally {
      setTestingConnection(false);
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
          
          {/* Lab Tests Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lab Tests</CardTitle>
                  <CardDescription>Quality test results for this batch</CardDescription>
                </div>
                {batch && (
                  <Button
                    onClick={() => setShowLabTestForm(!showLabTestForm)}
                    size="sm"
                    variant="outline"
                  >
                    {showLabTestForm ? 'Cancel' : '+ Add Lab Test'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lab Test Form */}
              {showLabTestForm && batch && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Test Type</label>
                        <input
                          type="text"
                          value={labTestForm.test_type}
                          onChange={(e) => setLabTestForm({ ...labTestForm, test_type: e.target.value })}
                          placeholder="e.g., Purity, Moisture, HMF"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Test Date</label>
                        <input
                          type="date"
                          value={labTestForm.test_date}
                          onChange={(e) => setLabTestForm({ ...labTestForm, test_date: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tested By</label>
                      <input
                        type="text"
                        value={labTestForm.tested_by}
                        onChange={(e) => setLabTestForm({ ...labTestForm, tested_by: e.target.value })}
                        placeholder="Laboratory name"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Result</label>
                      <textarea
                        value={labTestForm.result}
                        onChange={(e) => setLabTestForm({ ...labTestForm, result: e.target.value })}
                        placeholder="Test results and findings"
                        rows={3}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      />
                    </div>
                    <Button
                      onClick={async () => {
                        if (!batch?.id) return;
                        setCreatingLabTest(true);
                        try {
                          const newTest = await createLabTest({
                            batch: batch.id,
                            test_type: labTestForm.test_type,
                            result: labTestForm.result,
                            tested_by: labTestForm.tested_by,
                            test_date: labTestForm.test_date,
                          });
                          toast.success(
                            newTest.blockchain_tx_hash
                              ? 'Lab test created and recorded on blockchain!'
                              : 'Lab test created (blockchain recording pending)'
                          );
                          setLabTests([...labTests, newTest]);
                          setShowLabTestForm(false);
                          setLabTestForm({
                            test_type: '',
                            result: '',
                            tested_by: '',
                            test_date: new Date().toISOString().split('T')[0],
                          });
                          // Refresh batch to get updated data
                          await fetchBatch(batch.batch_id);
                        } catch (err: any) {
                          console.error('Error creating lab test:', err);
                          toast.error(err?.response?.data?.message || 'Failed to create lab test');
                        } finally {
                          setCreatingLabTest(false);
                        }
                      }}
                      variant="honey"
                      className="w-full"
                      disabled={creatingLabTest || !labTestForm.test_type || !labTestForm.result}
                    >
                      {creatingLabTest ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Lab Test'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Lab Tests List */}
              {labTests.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No lab tests recorded yet. Add a lab test to verify quality.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {labTests.map((test) => (
                    <Card key={test.id} className="bg-card">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{test.test_type}</Badge>
                              {test.blockchain_tx_hash && (
                                <Badge className="bg-green-500">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Tested by: {test.tested_by}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              Date: {new Date(test.test_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm">{test.result}</p>
                            {test.blockchain_tx_hash && (
                              <p className="text-xs text-muted-foreground mt-2 break-all">
                                TX: {test.blockchain_tx_hash.substring(0, 20)}...
                              </p>
                            )}
                          </div>
                          {!test.blockchain_tx_hash && batch && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const response = await api.post(`/labtests/${test.id}/record-on-chain/`);
                                  toast.success('Lab test recorded on blockchain!');
                                  await fetchBatch(batch.batch_id);
                                } catch (err: any) {
                                  toast.error(err?.response?.data?.message || 'Failed to record on blockchain');
                                }
                              }}
                            >
                              Record on Chain
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Certificates Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Certificates</CardTitle>
                  <CardDescription>Quality certificates for this batch</CardDescription>
                </div>
                {batch && (
                  <Button
                    onClick={() => setShowCertificateForm(!showCertificateForm)}
                    size="sm"
                    variant="outline"
                  >
                    {showCertificateForm ? 'Cancel' : '+ Issue Certificate'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Certificate Form */}
              {showCertificateForm && batch && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Certificate ID</label>
                      <input
                        type="text"
                        value={certificateForm.certificate_id}
                        onChange={(e) => setCertificateForm({ ...certificateForm, certificate_id: e.target.value })}
                        placeholder="e.g., CERT-2024-001"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Issued By</label>
                      <input
                        type="text"
                        value={certificateForm.issued_by}
                        onChange={(e) => setCertificateForm({ ...certificateForm, issued_by: e.target.value })}
                        placeholder="Certification authority name"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Issue Date</label>
                        <input
                          type="date"
                          value={certificateForm.issue_date}
                          onChange={(e) => setCertificateForm({ ...certificateForm, issue_date: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Expiry Date</label>
                        <input
                          type="date"
                          value={certificateForm.expiry_date}
                          onChange={(e) => setCertificateForm({ ...certificateForm, expiry_date: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!batch?.id) return;
                        setCreatingCertificate(true);
                        try {
                          const newCert = await issueCertificate({
                            batch: batch.id,
                            certificate_id: certificateForm.certificate_id,
                            issued_by: certificateForm.issued_by,
                            issue_date: certificateForm.issue_date,
                            expiry_date: certificateForm.expiry_date,
                          });
                          toast.success(
                            newCert.blockchain_tx_hash
                              ? 'Certificate issued and recorded on blockchain!'
                              : 'Certificate issued (blockchain recording pending)'
                          );
                          setCertificates([...certificates, newCert]);
                          setShowCertificateForm(false);
                          setCertificateForm({
                            certificate_id: '',
                            issued_by: '',
                            issue_date: new Date().toISOString().split('T')[0],
                            expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          });
                          // Refresh batch to get updated data
                          await fetchBatch(batch.batch_id);
                        } catch (err: any) {
                          console.error('Error issuing certificate:', err);
                          toast.error(err?.response?.data?.message || 'Failed to issue certificate');
                        } finally {
                          setCreatingCertificate(false);
                        }
                      }}
                      variant="honey"
                      className="w-full"
                      disabled={creatingCertificate || !certificateForm.certificate_id || !certificateForm.issued_by}
                    >
                      {creatingCertificate ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Issuing...
                        </>
                      ) : (
                        'Issue Certificate'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Certificates List */}
              {certificates.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No certificates issued yet. Issue a certificate to verify authenticity.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <Card key={cert.id} className="bg-card">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{cert.certificate_id}</Badge>
                              {cert.blockchain_tx_hash && (
                                <Badge className="bg-green-500">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Issued by: {cert.issued_by}
                            </p>
                            <p className="text-sm text-muted-foreground mb-1">
                              Issue Date: {new Date(cert.issue_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              Expiry Date: {new Date(cert.expiry_date).toLocaleDateString()}
                            </p>
                            {cert.blockchain_tx_hash && (
                              <p className="text-xs text-muted-foreground mt-2 break-all">
                                TX: {cert.blockchain_tx_hash.substring(0, 20)}...
                              </p>
                            )}
                          </div>
                          {!cert.blockchain_tx_hash && batch && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const response = await api.post(`/certificates/${cert.id}/record-on-chain/`);
                                  toast.success('Certificate recorded on blockchain!');
                                  await fetchBatch(batch.batch_id);
                                } catch (err: any) {
                                  toast.error(err?.response?.data?.message || 'Failed to record on blockchain');
                                }
                              }}
                            >
                              Record on Chain
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
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
            <CardContent className="space-y-4">
              {/* Connection Test Section */}
              <div className="border-b border-border pb-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Connection Status</p>
                  <div className="flex gap-2">
                    {!hardhatConnected && (
                      <Button
                        onClick={connectToHardhat}
                        size="sm"
                        variant="outline"
                        disabled={testingConnection || isConnecting}
                      >
                        Connect to Hardhat
                      </Button>
                    )}
                    <Button
                      onClick={testBlockchainConnection}
                      size="sm"
                      variant="outline"
                      disabled={testingConnection}
                    >
                      {testingConnection ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Hardhat connection status */}
                {hardhatConnected && (
                  <Alert className="border-green-500 bg-green-50">
                    <AlertDescription className="text-green-700">
                      ✓ Connected to Hardhat node
                    </AlertDescription>
                  </Alert>
                )}
                
                {hardhatConnectionError && !hardhatConnected && (
                  <Alert className="border-yellow-500 bg-yellow-50">
                    <AlertDescription className="text-yellow-700">
                      ⚠ {hardhatConnectionError}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Test result */}
                {connectionStatus && (
                  <Alert className={connectionStatus.connected ? 'border-green-500' : 'border-red-500'}>
                    <AlertDescription className={connectionStatus.connected ? 'text-green-700' : 'text-red-700'}>
                      {connectionStatus.connected ? '✓ ' : '✗ '}
                      {connectionStatus.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {batch?.blockchain_tx_hash ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <p className="text-sm font-semibold">Blockchain Verified</p>
                  </div>
                  <p className="text-xs break-all mb-2">
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

                  {!blockchainData && !verifying && (
                    <Button
                      onClick={() => verifyOnBlockchain(batch.batch_id)}
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
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
                          setRecording(true);
                          setError(null);
                          try {
                            console.log('Recording batch on blockchain:', batch.batch_id);
                            console.log('Batch object:', batch);
                            
                            // Ensure we have the numeric ID (primary key) for the API endpoint
                            // The DRF ViewSet expects the database primary key, not batch_id
                            const batchPk = batch.id;
                            if (!batchPk) {
                              throw new Error('Batch ID not found. Please refresh the page and try again.');
                            }
                            
                            // Create description from batch data
                            const description = `${batch.honey_type || 'Honey'} - ${batch.producer_name || 'Unknown'} - Qty: ${batch.quantity || 0}kg`;
                            
                            const apiUrl = `/batches/${batchPk}/record-on-chain/`;
                            console.log('Calling API:', apiUrl);
                            console.log('Request payload:', { description });
                            
                            // Call backend API to record on blockchain
                            const response = await api.post(apiUrl, {
                              description,
                            });
                            
                            console.log('API Response:', response.data);
                            
                            // Update batch with blockchain tx hash
                            if (response.data.blockchain_tx_hash) {
                              setBatch({ ...batch, blockchain_tx_hash: response.data.blockchain_tx_hash });
                              toast.success(response.data.message || 'Batch recorded on blockchain successfully!');
                              // Refresh the page data
                              await fetchBatch(batch.batch_id);
                            } else if (response.data.message) {
                              toast.info(response.data.message);
                            }
                          } catch (err: any) {
                            // Log full error details for debugging
                            console.error('Error recording batch:', err);
                            console.error('Error response:', err?.response);
                            console.error('Error response data:', err?.response?.data);
                            console.error('Error status:', err?.response?.status);
                            console.error('Error message:', err?.message);
                            
                            // Handle different error types
                            let errorMsg = 'Failed to record batch on blockchain';
                            const errorData = err?.response?.data;
                            const status = err?.response?.status;
                            
                            // Network error (backend not reachable)
                            if (!err?.response) {
                              errorMsg = `Cannot connect to backend server. Please ensure the Django backend is running at ${import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000'}`;
                            }
                            // HTTP error responses
                            else if (errorData) {
                              errorMsg = errorData?.message || errorData?.error || errorData?.detail || err?.message || errorMsg;
                              
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
                              
                              // Add status code context
                              if (status === 503) {
                                errorMsg = `Blockchain service unavailable. ${errorMsg}`;
                              } else if (status === 404) {
                                errorMsg = `Batch not found. ${errorMsg}`;
                              } else if (status === 401) {
                                errorMsg = `Authentication required. Please log in again.`;
                              } else if (status === 500) {
                                errorMsg = `Server error: ${errorMsg}`;
                              }
                            } else {
                              // Fallback error message
                              errorMsg = err?.message || `HTTP ${status}: ${errorMsg}`;
                            }
                            
                            setError(errorMsg);
                            toast.error(errorMsg, {
                              duration: 10000, // Show longer for detailed errors
                            });
                          } finally {
                            setRecording(false);
                          }
                        }}
                        variant="honey"
                        className="w-full"
                        disabled={!batch || recording}
                      >
                        {recording ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Recording...
                          </>
                        ) : (
                          'Record on Blockchain'
                        )}
                      </Button>
                      {error && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription className="text-xs">{error}</AlertDescription>
                        </Alert>
                      )}
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
