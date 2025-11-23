import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import JourneyMap from "@/components/JourneyMap";
import { getBatchById, getLabTests, getCertificates, verifyCertificate, flagLabTest, flagCertificate } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const AdministratorBatchDetail = () => {
  const { batch_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && (user.is_superuser || user.is_staff);

  interface Batch {
    id: number;
    batch_id: string;
    honey_type: string;
    producer_name: string;
    status: string;
    created_at?: string;
    journey_events?: JourneyEvent[];
  }
  interface LabTest {
    id: number;
    test_type: string;
    result: string;
    tested_by: string;
    test_date: string;
    is_approved?: boolean;
    is_rejected?: boolean;
  }
  interface Certificate {
    id: number;
    certificate_id: string;
    issued_by: string;
    issue_date: string;
    expiry_date: string;
    is_verified?: boolean;
    is_rejected?: boolean;
  }
  interface JourneyEvent {
    type: string;
    timestamp: number;
    admin: string;
    testId?: number;
    certId?: number;
    reason?: string;
  }
  const [batch, setBatch] = useState<Batch | null>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journeyEvents, setJourneyEvents] = useState<JourneyEvent[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchBatchDetail();
  }, [isAdmin, batch_id]);

  const fetchBatchDetail = async () => {
    setLoading(true);
    try {
      if (!batch_id) throw new Error("Batch ID missing");
      const batchData = await getBatchById(batch_id as string);
      setBatch(batchData);
      const tests = await getLabTests(batchData.id);
      setLabTests(tests);
      const certs = await getCertificates(batchData.id);
      setCertificates(certs);
      // Optionally fetch journey events from backend
      setJourneyEvents(batchData.journey_events || []);
    } catch (err) {
      setError("Failed to load batch details.");
    } finally {
      setLoading(false);
    }
  };

  // Admin review actions
  const handleApproveLabTest = async (testId: number) => {
    if (!user) return;
    try {
      await flagLabTest(testId, "Approved by admin", user.email);
      setJourneyEvents(prev => [...prev, { type: "Lab Test Approved", timestamp: Date.now(), admin: user.email, testId }]);
      fetchBatchDetail();
    } catch {
      setError("Failed to approve lab test.");
    }
  };

  const handleRejectLabTest = async (testId: number) => {
    if (!user) return;
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    try {
      await flagLabTest(testId, reason, user.email);
      setJourneyEvents(prev => [...prev, { type: "Lab Test Rejected", timestamp: Date.now(), admin: user.email, testId, reason }]);
      fetchBatchDetail();
    } catch {
      setError("Failed to reject lab test.");
    }
  };

  const handleVerifyCertificate = async (certId: number) => {
    if (!user) return;
    await verifyCertificate(certId, user.email);
    setJourneyEvents(prev => [...prev, { type: "Certificate Verified", timestamp: Date.now(), admin: user.email, certId }]);
    fetchBatchDetail();
  };

  const handleRejectCertificate = async (certId: number) => {
    if (!user) return;
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    try {
      await flagCertificate(certId, reason, user.email);
      setJourneyEvents(prev => [...prev, { type: "Certificate Rejected", timestamp: Date.now(), admin: user.email, certId, reason }]);
      fetchBatchDetail();
    } catch {
      setError("Failed to reject certificate.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <Alert><AlertDescription>{error}</AlertDescription></Alert>;
  if (!batch) return null;

  // Compute flagged items and suspicious steps for JourneyMap
  const flaggedItems = [
    ...labTests.filter(test => test.is_rejected || test.is_approved).map(test => ({
      type: "lab_test" as const,
      id: test.id,
      reason: test.is_rejected ? "Rejected by admin" : test.is_approved ? "Approved by admin" : "Suspicious activity detected",
      flaggedBy: user?.email || "Admin",
    })),
    ...certificates.filter(cert => cert.is_rejected || cert.is_verified).map(cert => ({
      type: "certificate" as const,
      id: cert.id,
      reason: cert.is_rejected ? "Rejected by admin" : cert.is_verified ? "Verified by admin" : "Suspicious activity detected",
      flaggedBy: user?.email || "Admin",
    }))
  ];
  const suspiciousSteps = flaggedItems.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-8">
      <Card className="max-w-5xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Batch Details: {batch.batch_id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Name:</strong> {batch.honey_type}</p>
          <p><strong>Producer:</strong> {batch.producer_name}</p>
          <p><strong>Status:</strong> {batch.status}</p>
          <p><strong>Date Created:</strong> {batch.created_at ? new Date(batch.created_at).toLocaleDateString() : "-"}</p>
        </CardContent>
      </Card>

      {/* Journey Map */}
      <Card className="max-w-5xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Journey Map</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pass batchId and flaggedItems to JourneyMap as per its props */}
          <JourneyMap batchId={batch?.batch_id} flaggedItems={flaggedItems} suspiciousSteps={suspiciousSteps} />
        </CardContent>
      </Card>

      {/* Lab Tests Section */}
      <Card className="max-w-5xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Lab Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {labTests.length === 0 ? (
            <div>No lab tests submitted for this batch.</div>
          ) : (
            labTests.map(test => (
              <div key={test.id} className="border rounded-lg p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <p><strong>Type:</strong> {test.test_type}</p>
                  <p><strong>Result:</strong> {test.result}</p>
                  <p><strong>Tested By:</strong> {test.tested_by}</p>
                  <p><strong>Date:</strong> {new Date(test.test_date).toLocaleDateString()}</p>
                  {test.is_approved && <Badge variant="secondary">Approved</Badge>}
                  {test.is_rejected && <Badge variant="destructive">Rejected</Badge>}
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  {test.is_approved ? (
                    <Button variant="secondary" disabled>Approved</Button>
                  ) : test.is_rejected ? (
                    <Button variant="destructive" disabled>Rejected</Button>
                  ) : (
                    <>
                      <Button variant="secondary" onClick={() => handleApproveLabTest(test.id)}>Review & Approve</Button>
                      <Button variant="destructive" onClick={() => handleRejectLabTest(test.id)}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Certificates Section */}
      <Card className="max-w-5xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div>No certificates submitted for this batch.</div>
          ) : (
            certificates.map(cert => (
              <div key={cert.id} className="border rounded-lg p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <p><strong>ID:</strong> {cert.certificate_id}</p>
                  <p><strong>Issued By:</strong> {cert.issued_by}</p>
                  <p><strong>Issue Date:</strong> {new Date(cert.issue_date).toLocaleDateString()}</p>
                  <p><strong>Expiry Date:</strong> {new Date(cert.expiry_date).toLocaleDateString()}</p>
                  {cert.is_verified && <Badge variant="secondary">Verified</Badge>}
                  {cert.is_rejected && <Badge variant="destructive">Rejected</Badge>}
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  {cert.is_verified ? (
                    <Button variant="secondary" disabled>Verified</Button>
                  ) : cert.is_rejected ? (
                    <Button variant="destructive" disabled>Rejected</Button>
                  ) : (
                    <>
                      <Button variant="secondary" onClick={() => handleVerifyCertificate(cert.id)}>Verify</Button>
                      <Button variant="destructive" onClick={() => handleRejectCertificate(cert.id)}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdministratorBatchDetail;
