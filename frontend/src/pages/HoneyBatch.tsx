import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TrustScore from "@/components/TrustScore";
import JourneyMap from "@/components/JourneyMap";
import AIQualityAnalyzer from "@/components/AIQualityAnalyzer";
import BlockchainVerification from "@/components/BlockchainVerification";
import BeekeeperProfile from "@/components/BeekeeperProfile";

const HoneyBatch = () => {
  const navigate = useNavigate();

  const trustFactors = [
    "Blockchain records confirmed across all checkpoints",
    "AI purity analysis shows 98% pure wildflower honey",
    "Beekeeper identity verified and certified",
    "No gaps in supply chain tracking",
    "Laboratory test results match on-chain data"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/")}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Vermont Wildflower Honey</h1>
                <p className="text-sm text-muted-foreground">Batch #HT-2025-VT-10150234</p>
              </div>
            </div>
            <Button variant="honey">
              Purchase This Batch
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-8">
            <JourneyMap />
            <AIQualityAnalyzer />
            <BeekeeperProfile />
          </div>

          {/* Right Column - Trust & Verification */}
          <div className="space-y-8">
            <TrustScore score={98} factors={trustFactors} />
            <BlockchainVerification />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HoneyBatch;
