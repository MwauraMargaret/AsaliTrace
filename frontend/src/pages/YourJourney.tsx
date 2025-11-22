import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Shield, Sparkles, CheckCircle, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-honey.jpg";
//import QRScanner from "@/components/QRScanner";

const YourJourney = () => {
  const navigate = useNavigate();
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const validateBatchId = (id: string): boolean => {
    const pattern = /^B\d+$/;
    return pattern.test(id.trim());
  };

  const handleVerifyBatch = () => {
    const trimmedId = batchId.trim();
    
    if (!trimmedId) {
      setError("Please enter a Batch ID");
      return;
    }
    
    if (!validateBatchId(trimmedId)) {
      setError("Please enter a valid Batch ID. It should look like: B003");
      return;
    }
    
    setError("");
    navigate(`/verify/${trimmedId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifyBatch();
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setShowScanner(false);
    
    // Extract batch ID from QR code (assuming QR contains just the batch ID or a URL with it)
    let extractedId = decodedText;
    
    // If QR code contains a URL, extract the batch ID from it
    if (decodedText.includes('/verify/')) {
      const parts = decodedText.split('/verify/');
      extractedId = parts[parts.length - 1];
    }
    
    setBatchId(extractedId);
    
    // Validate and navigate
    if (validateBatchId(extractedId)) {
      setError("");
      navigate(`/verify/${extractedId}`);
    } else {
      setError("Scanned QR code does not contain a valid Batch ID");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card to-muted">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-3xl">🍯</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                AsaliTrace
              </span>
            </button>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full border border-secondary/30 mb-6">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">Trace Your Honey's Authentic Journey</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Your Honey Journey
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every jar of honey has a unique story. Enter your Batch ID to discover 
              the authentic path from hive to home, verified by blockchain technology.
            </p>
          </div>

          {/* Verification Card */}
          <Card className="max-w-3xl mx-auto mb-12 border-2 border-primary/20 shadow-[var(--shadow-honey)]">
            <CardContent className="p-8 md:p-12">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Enter Your Batch ID</h2>
                  <p className="text-muted-foreground">
                    Find the unique Batch ID on the back of your honey jar's label
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label htmlFor="batch-id-input" className="sr-only">Batch ID</label>
                      <Input
                        id="batch-id-input"
                        type="text"
                        placeholder="Enter your Batch ID (e.g., B001/B00322)..."
                        value={batchId}
                        onChange={(e) => {
                          setBatchId(e.target.value);
                          setError("");
                        }}
                        onKeyPress={handleKeyPress}
                        className="h-14 text-base"
                        aria-describedby={error ? "batch-id-error" : "batch-id-help"}
                      />
                    </div>
                    <Button 
                      size="lg" 
                      variant="honey" 
                      className="group sm:w-auto w-full"
                      onClick={handleVerifyBatch}
                    >
                      Trace Your Honey
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-sm text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => setShowScanner(true)}
                  >
                    <QrCode className="w-5 h-5" />
                    Scan QR Code
                  </Button>
                </div>
                
                {error && (
                  <p id="batch-id-error" className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}
                
                {!error && (
                  <div className="space-y-2">
                    <p id="batch-id-help" className="text-sm text-muted-foreground text-center">
                      Look for the unique Batch ID on the back of your jar's label
                    </p>
                    <div className="text-center">
                      <button
                        onClick={() => {
                          setBatchId("B001");
                          setTimeout(() => navigate("/verify/B001"), 100);
                        }}
                        className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                      >
                        Try a sample batch ID
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Visual Guide */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardContent className="p-6">
                <div className="relative mb-4">
                  <div className="absolute -inset-2 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-2xl blur-2xl" />
                  <img 
                    src={heroImage} 
                    alt="Honey jar with visible Batch ID label" 
                    className="relative rounded-2xl w-full"
                  />
                </div>
                <h3 className="text-lg font-semibold mb-2">Where to Find Your Batch ID</h3>
                <p className="text-sm text-muted-foreground">
                  Every AsaliTrace jar has a unique Batch ID printed on the back label, 
                  typically starting with B letters followed by alphanumeric characters.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4">Benefits of Honey Traceability</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Quality Assurance</div>
                      <div className="text-sm text-muted-foreground">Track testing results and handling procedures 
                        that preserve honey's natural properties.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Authenticity Verification</div>
                      <div className="text-sm text-muted-foreground">Confirms your honey is pure and unadulterated, 
                        exactly as nature intended.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="font-medium">Beekeeper Support</div>
                      <div className="text-sm text-muted-foreground">Directly connects consumers with beekeepers, \
                        supporting sustainable beekeeping communities.</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Food Safety</div>
                      <div className="text-sm text-muted-foreground">Quick identification and recall capabilities 
                        if any issues arise in the supply chain.</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="text-center">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              Our Transparent Ecosystem
            </h3>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div>
                <div className="text-3xl font-bold text-primary">Percent verified</div>
                <div className="text-sm text-muted-foreground">Verified Authentic</div>
              </div>
              <div className="h-12 w-px bg-border hidden sm:block" />
              <div>
                <div className="text-3xl font-bold text-primary">No. of batches</div>
                <div className="text-sm text-muted-foreground">Traced Batches</div>
              </div>
              <div className="h-12 w-px bg-border hidden sm:block" />
              <div>
                <div className="text-3xl font-bold text-primary">No. of producers</div>
                <div className="text-sm text-muted-foreground">Partner Beekeepers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

     // {
     //showScanner && 
        //<QRScanner
        //  onScanSuccess={handleScanSuccess}
        //  onClose={() => setShowScanner(false)}
        ///>
      }*/
    </div>
  );
};

export default YourJourney;