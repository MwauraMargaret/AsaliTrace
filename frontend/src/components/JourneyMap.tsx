import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Truck, Store, FlaskConical, Award, Link as LinkIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBatchJourney } from "@/services/api";

interface JourneyStep {
  id: number;
  title: string;
  location: string;
  date: string;
  verified: boolean;
  icon: React.ReactNode;
  action?: string;
  user?: string;
  blockchain_tx_hash?: string;
  timestamp?: string;
}

const getIconForAction = (action?: string) => {
  switch (action) {
    case 'create':
      return <MapPin className="w-5 h-5" />;
    case 'lab_test':
      return <FlaskConical className="w-5 h-5" />;
    case 'certificate':
      return <Award className="w-5 h-5" />;
    case 'record_blockchain':
      return <LinkIcon className="w-5 h-5" />;
    default:
      return <Package className="w-5 h-5" />;
  }
};

const JourneyMap = () => {
  const { id: batchId } = useParams<{ id: string }>();
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJourney = async () => {
      if (!batchId) {
        setError("No batch ID provided");
        setLoading(false);
        return;
      }

      try {
        const data = await getBatchJourney(batchId);
        
        // Transform API data to JourneyStep format
        const steps: JourneyStep[] = data.journey_steps.map((step: any) => ({
          id: step.id,
          title: step.title,
          location: step.location,
          date: step.date,
          verified: step.verified || false,
          icon: getIconForAction(step.action),
          action: step.action,
          user: step.user,
          blockchain_tx_hash: step.blockchain_tx_hash,
          timestamp: step.timestamp,
        }));
        
        setJourneySteps(steps);
      } catch (err: any) {
        console.error("Failed to load journey:", err);
        const status = err?.response?.status;
        const errorData = err?.response?.data;
        
        if (status === 401) {
          setError("Authentication required. Please login to view the journey.");
        } else if (status === 403 || status === 404) {
          setError(errorData?.detail || errorData?.message || "You don't have permission to view this batch's journey.");
        } else {
          setError(errorData?.message || errorData?.detail || "Failed to load journey data. Please ensure you have access to this batch.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
  }, [batchId]);
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗺️ Journey from Hive to Jar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading journey data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗺️ Journey from Hive to Jar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
            <p className="text-sm mt-2">Please ensure you have access to this batch.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (journeySteps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗺️ Journey from Hive to Jar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No journey data available yet.</p>
            <p className="text-sm mt-2">The journey will appear as the batch progresses through the supply chain.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🗺️ Journey from Hive to Jar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-secondary via-primary to-accent" />
          
          {/* Journey steps */}
          <div className="space-y-6">
            {journeySteps.map((step, index) => (
              <div key={step.id} className="relative flex gap-4 items-start">
                {/* Icon circle */}
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-primary-foreground shadow-[var(--shadow-honey)]">
                  {step.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold">{step.title}</h4>
                    {step.verified && (
                      <Badge variant="verified" className="flex-shrink-0">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                     {step.location}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    {step.date}
                  </p>
                  {step.user && (
                    <p className="text-xs text-muted-foreground">
                      By: {step.user}
                    </p>
                  )}
                  {step.blockchain_tx_hash && (
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      TX: {step.blockchain_tx_hash.substring(0, 20)}...
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JourneyMap;
