import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Package, 
  Truck, 
  Store, 
  FlaskConical, 
  Award, 
  Link as LinkIcon, 
  Loader2,
  Flag,
  AlertTriangle
} from "lucide-react";
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
  flag_reason?: string;
  is_suspicious?: boolean;
}

interface FlaggedItem {
  type: 'lab_test' | 'certificate';
  id: number;
  reason: string;
  flaggedBy: string;
}

interface JourneyMapProps {
  batchId?: string;
  flaggedItems?: FlaggedItem[];
  suspiciousSteps?: number;
}

const getIconForAction = (action?: string, isSuspicious?: boolean) => {
  if (isSuspicious) {
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  }
  
  switch (action) {
    case 'create':
      return <MapPin className="w-5 h-5" />;
    case 'lab_test':
      return <FlaskConical className="w-5 h-5" />;
    case 'certificate':
      return <Award className="w-5 h-5" />;
    case 'record_blockchain':
      return <LinkIcon className="w-5 h-5" />;
    case 'flag_suspicious':
      return <Flag className="w-5 h-5 text-red-500" />;
    case 'verify_certificate':
      return <Award className="w-5 h-5 text-green-500" />;
    default:
      return <Package className="w-5 h-5" />;
  }
};

const JourneyMap = ({ batchId: propBatchId, flaggedItems = [], suspiciousSteps }: JourneyMapProps) => {
  const { id: routeBatchId } = useParams<{ id: string }>();
  const batchId = propBatchId || routeBatchId;
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
        let steps: JourneyStep[] = data.journey_steps.map((step: any) => ({
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
          flag_reason: step.flag_reason,
          is_suspicious: step.action === 'flag_suspicious'
        }));

        // Add suspicious activity steps from flaggedItems prop
        if (flaggedItems.length > 0) {
          flaggedItems.forEach((item, index) => {
            const itemType = item.type === 'lab_test' ? 'Lab Test' : 'Certificate';
            steps.push({
              id: steps.length + 1 + index,
              title: `Suspicious ${itemType} Flagged`,
              location: 'Admin Review',
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              verified: false,
              icon: getIconForAction('flag_suspicious', true),
              action: 'flag_suspicious',
              user: item.flaggedBy,
              flag_reason: item.reason,
              is_suspicious: true,
              timestamp: new Date().toISOString()
            });
          });
        }

        // Sort steps by timestamp if available, otherwise by ID
        steps.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          }
          return a.id - b.id;
        });
        
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
  }, [batchId, flaggedItems]);

  // Main render block
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🗺️ Journey from Hive to Jar</CardTitle>
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
          <CardTitle className="flex items-center gap-2">🗺️ Journey from Hive to Jar</CardTitle>
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
          <CardTitle className="flex items-center gap-2">🗺️ Journey from Hive to Jar</CardTitle>
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
        <CardTitle className="flex items-center gap-2">🗺️ Journey from Hive to Jar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-secondary via-primary to-accent" />
          <div>
            <div className="space-y-6">
              {journeySteps.map((step, index) => (
                <div key={step.id} className="relative flex gap-4 items-start">
                  {/* Icon circle */}
                  <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground shadow-lg ${step.is_suspicious ? 'bg-red-500 border-2 border-red-600' : 'bg-gradient-to-br from-secondary to-primary'}`}>{step.icon}</div>
                  {/* Content */}
                  <div className={`flex-1 rounded-xl p-4 border transition-all ${step.is_suspicious ? 'bg-red-50 border-red-200 hover:border-red-300' : 'bg-card border-border hover:border-primary/30'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className={`font-semibold ${step.is_suspicious ? 'text-red-800' : ''}`}>{step.title}</h4>
                      <div className="flex gap-2">
                        {step.is_suspicious && (<Badge variant="destructive" className="flex-shrink-0"><Flag className="w-3 h-3 mr-1" />Flagged</Badge>)}
                        {step.verified && !step.is_suspicious && (<Badge variant="verified" className="flex-shrink-0">Verified</Badge>)}
                      </div>
                    </div>
                    <p className={`text-sm mb-1 ${step.is_suspicious ? 'text-red-700' : 'text-muted-foreground'}`}>{step.location}</p>
                    <p className={`text-xs mb-1 ${step.is_suspicious ? 'text-red-600' : 'text-muted-foreground'}`}>{step.date}</p>
                    {step.user && (<p className={`text-xs ${step.is_suspicious ? 'text-red-600' : 'text-muted-foreground'}`}>By: {step.user}</p>)}
                    {step.flag_reason && (<div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-md"><p className="text-xs font-medium text-red-800">Flag Reason:</p><p className="text-xs text-red-700">{step.flag_reason}</p></div>)}
                    {step.blockchain_tx_hash && !step.is_suspicious && (<p className="text-xs text-muted-foreground mt-2 break-all">TX: {step.blockchain_tx_hash.substring(0, 20)}...</p>)}
                    {/* Admin action attribution for suspicious flags */}
                    {step.is_suspicious && step.user && (<div className="mt-2 flex items-center gap-2"><Badge variant="outline" className="text-xs">Admin Action by: {step.user}</Badge></div>)}
                  </div>
                  {/* Step number */}
                  <div className="absolute -left-2 top-1 w-6 h-6 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium border-2 border-background">{index + 1}</div>
                </div>
              ))}
            </div>
            {/* Summary section */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center"><p className="font-semibold">{journeySteps.length}</p><p className="text-muted-foreground">Total Steps</p></div>
                <div className="text-center"><p className="font-semibold text-green-600">{journeySteps.filter(step => step.verified && !step.is_suspicious).length}</p><p className="text-muted-foreground">Verified</p></div>
                <div className="text-center"><p className="font-semibold text-red-600">{typeof suspiciousSteps === 'number' ? suspiciousSteps : journeySteps.filter(step => step.is_suspicious).length}</p><p className="text-muted-foreground">Flagged</p></div>
                <div className="text-center"><p className="font-semibold">{Math.round((journeySteps.filter(step => step.verified && !step.is_suspicious).length / journeySteps.filter(step => !step.is_suspicious).length) * 100) || 0}%</p><p className="text-muted-foreground">Completion</p></div>
              </div>
              {/* Status indicators */}
              {(typeof suspiciousSteps === 'number' ? suspiciousSteps : flaggedItems.length) > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-medium text-red-800">Admin Review Required</p>
                  </div>
                  <p className="text-xs text-red-700 mt-1">
                    This batch has {(typeof suspiciousSteps === 'number' ? suspiciousSteps : flaggedItems.length)} flagged item{(typeof suspiciousSteps === 'number' ? suspiciousSteps : flaggedItems.length) > 1 ? 's' : ''} that require administrative review.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JourneyMap;