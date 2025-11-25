import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import JourneyMap from "@/components/JourneyMap";
import { getBatchJourney } from "@/services/api";

const VerifyJourney = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendDetails, setBackendDetails] = useState<any>(null);

  useEffect(() => {
    const validateBatch = async () => {
      setLoading(true);
      setError(null);
      setExists(false);
      setBackendDetails(null);
      try {
        const data = await getBatchJourney(batchId!);
        setBackendDetails(data);
        if (data && data.journey_steps && data.journey_steps.length > 0) {
          setExists(true);
        } else if (data && data.journey_steps && data.journey_steps.length === 0) {
          setError("Batch exists, but no journey steps are recorded yet.");
        } else if (data && data.error) {
          setError(data.message || data.error);
        } else {
          setError("No audit trail found for this Batch ID. This batch is not registered on AsaliTrace.");
        }
      } catch (err: any) {
        let backendMsg = err?.response?.data?.message || err?.response?.data?.error;
        if (err?.response?.status === 404 || err?.response?.status === 403) {
          setError(backendMsg || "No audit trail found for this Batch ID. This batch is not registered on AsaliTrace.");
          setBackendDetails(err?.response?.data);
        } else {
          setError(backendMsg || "Failed to validate batch. Please try again or check your Batch ID.");
          setBackendDetails(err?.response?.data);
        }
        setExists(false);
      } finally {
        setLoading(false);
      }
    };
    if (batchId) validateBatch();
  }, [batchId]);

  if (loading) {
    return (
      <Card className="max-w-xl mx-auto mt-16">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            Validating Batch ID...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Checking AsaliTrace blockchain audit trail...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-xl mx-auto mt-16">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            Batch Lookup Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
            {backendDetails && (
              <div className="mt-4 text-xs text-left bg-muted/40 rounded p-2 border border-border">
                <pre>{JSON.stringify(backendDetails, null, 2)}</pre>
              </div>
            )}
            <button
              onClick={() => navigate("/journey")}
              className="mt-4 text-primary underline underline-offset-4"
            >
              Try another Batch ID
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (exists) {
    return (
      <Card className="max-w-xl mx-auto mt-16">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Batch Verified!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 text-center text-green-700 font-semibold">
            Success! The Batch ID <span className="font-mono bg-muted px-2 py-1 rounded">{batchId}</span> exists in AsaliTrace's blockchain-based audit trail.
          </div>
          <JourneyMap batchId={batchId} />
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default VerifyJourney;
