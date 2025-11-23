import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Flag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BlockchainVerification from "@/components/BlockchainVerification";
import JourneyMap from "@/components/JourneyMap";
//import AIQualityAnalyzer from "@/components/AIQualityAnalyzer";
//import BeekeeperProfile from "@/components/BeekeeperProfile";
//import TrustScore from "@/components/TrustScore";
import { 
  getBatchById, 
  getBatches, 
  createLabTest, 
  getLabTests, 
  issueCertificate, 
  getCertificates,
  flagLabTest,
  flagCertificate,
  verifyCertificate,
  recordLabTestOnChain,
  recordCertificateOnChain
} from "@/services/api";
import { useBlockchain } from "@/hooks/useBlockchain";
import { useAuth } from "@/contexts/AuthContext";
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
  created_by_email?: string;
  owner_email?: string;
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
  is_flagged?: boolean;
  flagged_by?: string;
  flag_reason?: string;
}

interface Certificate {
  id?: number;
  batch?: number;
  certificate_id: string;
  issued_by: string;
  issue_date: string;
  expiry_date: string;
  blockchain_tx_hash?: string | null;
  is_verified?: boolean;
  verified_by?: string;
  is_flagged?: boolean;
  flagged_by?: string;
  flag_reason?: string;
}

interface FlaggedItem {
  type: 'lab_test' | 'certificate';
  id: number;
  reason: string;
  flaggedBy: string;
}

interface HoneyBatchProps {
  adminView?: boolean;
}

const HoneyBatch = ({ adminView = false }: HoneyBatchProps) => {
  const { user } = useAuth();
  const isAdmin = adminView && (user?.is_superuser || user?.is_staff);
  const { id } = useParams();
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
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
  
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


  // User-level batch status choices for creation
  const batchStatusChoices = [
    { value: 'created', label: 'Created' },
    { value: 'harvested', label: 'Harvested' },
    { value: 'processing', label: 'Processing' },
    { value: 'packaged', label: 'Packaged' },
  ];

  const trustFactors = [
    "Blockchain records confirmed across all checkpoints",
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

  // Update flagged items when lab tests or certificates change
  useEffect(() => {
    const newFlaggedItems: FlaggedItem[] = [];
    
    labTests.forEach(test => {
      if (test.is_flagged && test.id) {
        newFlaggedItems.push({
          type: 'lab_test',
          id: test.id,
          reason: test.flag_reason || 'Suspicious activity detected',
          flaggedBy: test.flagged_by || 'Admin'
        });
      }
    });
    
    certificates.forEach(cert => {
      if (cert.is_flagged && cert.id) {
        newFlaggedItems.push({
          type: 'certificate',
          id: cert.id,
          reason: cert.flag_reason || 'Suspicious activity detected',
          flaggedBy: cert.flagged_by || 'Admin'
        });
      }
    });
    
    setFlaggedItems(newFlaggedItems);
  }, [labTests, certificates]);

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

  // Admin action: Flag suspicious lab test
  const handleFlagLabTest = async (testId: number) => {
    if (!isAdmin) {
      toast.error('Only administrators can flag suspicious activity');
      return;
    }

    const reason = prompt('Please provide a reason for flagging this lab test:');
    if (!reason) return;

    try {
      await flagLabTest(testId, reason, user?.email || 'Admin');
      toast.error('Lab test flagged as suspicious', {
        description: `Admin Action by: ${user?.email}`
      });
      
      // Update local state
      setLabTests(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              is_flagged: true, 
              flagged_by: user?.email,
              flag_reason: reason 
            }
          : test
      ));
      
      // Refresh batch data
      if (batch) await fetchBatch(batch.batch_id);
    } catch (err: any) {
      console.error('Error flagging lab test:', err);
      toast.error(err?.response?.data?.message || 'Failed to flag lab test');
    }
  };

  // Admin action: Flag suspicious certificate
  const handleFlagCertificate = async (certId: number) => {
    if (!isAdmin) {
      toast.error('Only administrators can flag suspicious activity');
      return;
    }

    const reason = prompt('Please provide a reason for flagging this certificate:');
    if (!reason) return;

    try {
      await flagCertificate(certId, reason, user?.email || 'Admin');
      toast.error('Certificate flagged as suspicious', {
        description: `Admin Action by: ${user?.email}`
      });
      
      // Update local state
      setCertificates(prev => prev.map(cert => 
        cert.id === certId 
          ? { 
              ...cert, 
              is_flagged: true, 
              flagged_by: user?.email,
              flag_reason: reason 
            }
          : cert
      ));
      
      // Refresh batch data
      if (batch) await fetchBatch(batch.batch_id);
    } catch (err: any) {
      console.error('Error flagging certificate:', err);
      toast.error(err?.response?.data?.message || 'Failed to flag certificate');
    }
  };

  // Admin action: Verify certificate
  const handleVerifyCertificate = async (certId: number) => {
    if (!isAdmin) {
      toast.error('Only administrators can verify certificates');
      return;
    }

    try {
      await verifyCertificate(certId, user?.email || 'Admin');
      toast.success('Certificate verified successfully', {
        description: `Admin Action by: ${user?.email}`
      });
      
      // Update local state
      setCertificates(prev => prev.map(cert => 
        cert.id === certId 
          ? { 
              ...cert, 
              is_verified: true, 
              verified_by: user?.email 
            }
          : cert
      ));
      
      // Refresh batch data
      if (batch) await fetchBatch(batch.batch_id);
    } catch (err: any) {
      console.error('Error verifying certificate:', err);
      toast.error(err?.response?.data?.message || 'Failed to verify certificate');
    }
  };

  // Admin action: Record lab test on blockchain
  const handleRecordLabTestOnChain = async (testId: number) => {
    if (!isAdmin) {
      toast.error('Only administrators can record lab tests on blockchain');
      return;
    }

    try {
      const response = await recordLabTestOnChain(testId);
      toast.success('Lab test recorded on blockchain!', {
        description: `Admin Action by: ${user?.email}`
      });
      
      // Refresh batch data
      if (batch) await fetchBatch(batch.batch_id);
    } catch (err: any) {
      console.error('Error recording lab test on chain:', err);
      toast.error(err?.response?.data?.message || 'Failed to record lab test on blockchain');
    }
  };

  // Admin action: Record certificate on blockchain
  const handleRecordCertificateOnChain = async (certId: number) => {
    if (!isAdmin) {
      toast.error('Only administrators can record certificates on blockchain');
      return;
    }

    try {
      const response = await recordCertificateOnChain(certId);
      toast.success('Certificate recorded on blockchain!', {
        description: `Admin Action by: ${user?.email}`
      });
      
      // Refresh batch data
      if (batch) await fetchBatch(batch.batch_id);
    } catch (err: any) {
      console.error('Error recording certificate on chain:', err);
      toast.error(err?.response?.data?.message || 'Failed to record certificate on blockchain');
    }
  };

  const verifyOnBlockchain = async (batchId: string) => {
    if (!isAdmin) {
      toast.error('Only administrators can verify on blockchain');
      return;
    }

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
          toast.success('Batch verified on blockchain!', {
            description: `Admin Action by: ${user?.email}`
          });
          return;
        }
      } catch (apiErr: any) {
        // If backend verification fails, try frontend (requires wallet)
        if (isConnected && (signer || provider)) {
          try {
            const data = await verifyBatch(batchId) as BlockchainBatchData | null;
            if (data) {
              setBlockchainData(data);
              toast.success('Batch verified on blockchain!', {
                description: `Admin Action by: ${user?.email}`
              });
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
        <div className="container mx-auto px-4 py-4">
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
            <Button
              variant="ghost"
              onClick={() => navigate("/batches")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Batches
            </Button>
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
            {/* Batch status dropdown (admin only, only in adminView) */}
            {isAdmin && batch && (
              <>
                <span className="ml-4 text-sm text-muted-foreground">Status:</span>
                <select
                  value={batch.status}
                  onChange={e => {
                    // TODO: Implement status update API call here
                    setBatch({ ...batch, status: e.target.value });
                  }}
                  className="border border-border rounded-lg px-2 py-1 bg-card text-sm"
                >
                  {batchStatusChoices.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
        {/* Left section */}
        <div className="lg:col-span-2 space-y-8">
          <JourneyMap flaggedItems={flaggedItems} suspiciousSteps={labTests.filter(t => t.is_flagged).length + certificates.filter(c => c.is_flagged).length} />
          
          {/* Lab Tests Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lab Tests</CardTitle>
                  <CardDescription>Quality test results for this batch</CardDescription>
                </div>
                {batch && (isAdmin || (!adminView && user && (batch.created_by_email === user.email || batch.owner_email === user.email))) && (
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
              {/* Lab Test Form - Admin or batch owner */}
              {showLabTestForm && batch && (isAdmin || (!adminView && user && (batch.created_by_email === user.email || batch.owner_email === user.email))) && (
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
                        // Only admins or batch owners can create lab tests
                        const isOwner = user && (batch.created_by_email === user.email || batch.owner_email === user.email);
                        if (!isAdmin && !isOwner) {
                          toast.error('Only the batch owner or an admin can create lab tests.');
                          return;
                        }
                        // Ensure test_date is always YYYY-MM-DD
                        let formattedDate = labTestForm.test_date;
                        // If not already in YYYY-MM-DD, convert
                        if (/\d{2}-\d{2}-\d{4}/.test(formattedDate)) {
                          // MM-DD-YYYY to YYYY-MM-DD
                          const [mm, dd, yyyy] = formattedDate.split('-');
                          formattedDate = `${yyyy}-${mm}-${dd}`;
                        }
                        const payload = {
                          batch: batch.id,
                          test_type: labTestForm.test_type,
                          result: labTestForm.result,
                          tested_by: labTestForm.tested_by,
                          test_date: formattedDate,
                        };
                        console.log('LabTest payload:', payload);
                        setCreatingLabTest(true);
                        try {
                          const newTest = await createLabTest(payload);
                          toast.success(
                            newTest.blockchain_tx_hash
                              ? 'Lab test created and recorded on blockchain!'
                              : 'Lab test created (blockchain recording pending)',
                            {
                              description: `${isAdmin ? 'Admin Action by: ' : 'Submitted by: '}${user?.email}`
                            }
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
                          toast.error(err?.response?.data?.message || err?.message || 'Failed to create lab test. Please check your permissions and try again.');
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
                    {isAdmin 
                      ? "No lab tests recorded yet. Add a lab test to verify quality."
                      : "No lab tests recorded yet. Review in progress."
                    }
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {labTests.map((test) => (
                    <Card key={test.id} className={`bg-card ${test.is_flagged ? 'border-red-500 border-2' : ''}`}>
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
                              {test.is_flagged && (
                                <Badge variant="destructive">
                                  <Flag className="w-3 h-3 mr-1" />
                                  Flagged
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
                            {test.is_flagged && (
                              <Alert variant="destructive" className="mt-2">
                                <AlertDescription className="text-xs">
                                  <strong>Flagged by: {test.flagged_by}</strong><br />
                                  Reason: {test.flag_reason}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            {/* Admin-only controls for lab tests, only in adminView */}
                            {isAdmin && !test.blockchain_tx_hash && batch && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRecordLabTestOnChain(test.id!)}
                                disabled={test.is_flagged}
                              >
                                Record on Chain
                              </Button>
                            )}
                            {isAdmin && !test.is_flagged && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFlagLabTest(test.id!)}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <Flag className="w-3 h-3 mr-1" />
                                Flag
                              </Button>
                            )}
                            {!isAdmin && !test.blockchain_tx_hash && (
                              <Badge variant="secondary" className="self-start">
                                Under Review
                              </Badge>
                            )}
                          </div>
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
                {batch && (isAdmin || (!adminView && user && (batch.created_by_email === user.email || batch.owner_email === user.email))) && (
                  <Button
                    onClick={() => setShowCertificateForm(!showCertificateForm)}
                    size="sm"
                    variant="outline"
                  >
                    {showCertificateForm ? 'Cancel' : '+Provide Certification'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Certificate Form - Admin or batch owner */}
              {showCertificateForm && batch && (isAdmin || (!adminView && user && (batch.created_by_email === user.email || batch.owner_email === user.email))) && (
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
                              : 'Certificate issued (blockchain recording pending)',
                            {
                              description: `${isAdmin ? 'Admin Action by: ' : 'Submitted by: '}${user?.email}`
                            }
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
                    {isAdmin
                      ? "No certificates issued yet. Issue a certificate to verify authenticity."
                      : "No certificates issued yet. Review in progress."
                    }
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <Card key={cert.id} className={`bg-card ${cert.is_flagged ? 'border-red-500 border-2' : ''}`}>
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
                              {cert.is_verified && (
                                <Badge className="bg-blue-500">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Certified
                                </Badge>
                              )}
                              {cert.is_flagged && (
                                <Badge variant="destructive">
                                  <Flag className="w-3 h-3 mr-1" />
                                  Flagged
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
                            {cert.is_flagged && (
                              <Alert variant="destructive" className="mt-2">
                                <AlertDescription className="text-xs">
                                  <strong>Flagged by: {cert.flagged_by}</strong><br />
                                  Reason: {cert.flag_reason}
                                </AlertDescription>
                              </Alert>
                            )}
                            {cert.is_verified && (
                              <Alert className="mt-2 border-green-500 bg-green-50">
                                <AlertDescription className="text-xs text-green-700">
                                  <strong>Verified by: {cert.verified_by}</strong>
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            {/* Admin-only controls for certificates, only in adminView */}
                            {isAdmin && !cert.blockchain_tx_hash && batch && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRecordCertificateOnChain(cert.id!)}
                                disabled={cert.is_flagged}
                              >
                                Record on Chain
                              </Button>
                            )}
                            {isAdmin && !cert.is_verified && !cert.is_flagged && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerifyCertificate(cert.id!)}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verify
                              </Button>
                            )}
                            {isAdmin && !cert.is_flagged && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFlagCertificate(cert.id!)}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <Flag className="w-3 h-3 mr-1" />
                                Flag
                              </Button>
                            )}
                            {!isAdmin && (!cert.blockchain_tx_hash || !cert.is_verified) && (
                              <Badge variant="secondary" className="self-start">
                                Under Review
                              </Badge>
                            )}
                          </div>
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
                        {isAdmin && (
                          <><br /><strong>Admin Action by: {user?.email}</strong></>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Admin-only blockchain verify button, only in adminView */}
                  {!blockchainData && !verifying && isAdmin && (
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

                  {!isAdmin && !blockchainData && (
                    <Badge variant="secondary" className="w-full justify-center mt-2">
                      Verification Under Review
                    </Badge>
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
                  
                  {/* Admin-only blockchain record button, only in adminView */}
                  {batch && isAdmin && (
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
                            // ...existing code...
                            // Call backend API to record on blockchain
                            const batchPk = batch.id;
                            if (!batchPk) throw new Error('Batch ID not found. Please refresh the page and try again.');
                            const description = `${batch.honey_type || 'Honey'} - ${batch.producer_name || 'Unknown'} - Qty: ${batch.quantity || 0}kg`;
                            const apiUrl = `/batches/${batchPk}/record-on-chain/`;
                            const response = await api.post(apiUrl, { description });
                            if (response.data.blockchain_tx_hash) {
                              setBatch({ ...batch, blockchain_tx_hash: response.data.blockchain_tx_hash });
                              toast.success(response.data.message || 'Batch recorded on blockchain successfully!', {
                                description: `Admin Action by: ${user?.email}`
                              });
                              await fetchBatch(batch.batch_id);
                            } else if (response.data.message) {
                              toast.info(response.data.message);
                            }
                          } catch (err: any) {
                            // ...existing code...
                            let errorMsg = 'Failed to record batch on blockchain';
                            const errorData = err?.response?.data;
                            const status = err?.response?.status;
                            if (!err?.response) {
                              errorMsg = `Cannot connect to backend server. Please ensure the Django backend is running at ${import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000'}`;
                            } else if (errorData) {
                              errorMsg = errorData?.message || errorData?.error || errorData?.detail || err?.message || errorMsg;
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
                              errorMsg = err?.message || `HTTP ${status}: ${errorMsg}`;
                            }
                            setError(errorMsg);
                            toast.error(errorMsg, { duration: 10000 });
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

                  {batch && !isAdmin && (
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      Blockchain Recording Under Review
                    </Badge>
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