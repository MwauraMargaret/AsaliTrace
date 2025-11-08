import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HeroSection from "@/components/HeroSection";
import { Shield, Sparkles, Map, TrendingUp, ArrowRight, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Blockchain Verified",
      description: "Every batch recorded on immutable blockchain ledgers for complete transparency"
    },
   // {
     // icon: <Sparkles className="w-8 h-8 text-secondary" />,
     // title: "AI Quality Analysis",
     // description: "Advanced AI models analyze purity, grade, and authenticity of every sample"
    //},
    {
      icon: <Map className="w-8 h-8 text-accent" />,
      title: "Full Journey Tracking",
      description: "Follow honey's path from hive to harvest to your home with interactive maps"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      title: "Trust Score",
     // description: "AI-powered confidence ratings with friendly explanations you can understand"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🍯</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                AsaliTrace
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                How It Works
              </a>
              <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </a>
              <a href="#beekeepers" className="text-sm font-medium hover:text-primary transition-colors">
                For Beekeepers
              </a>
            </div>
            {user ? (
              <Button variant="honey" onClick={() => navigate('/account')}>
                <User className="w-4 h-4 mr-2" />
                Account
              </Button>
            ) : (
              <Button variant="honey" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-muted to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">
              Our Technology
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Sweet Technology with a <span className="text-primary">Human Touch</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              We combine cutting-edge blockchain and AI to make honey traceability 
              simple, transparent, and emotionally reassuring.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center group hover:scale-105 transition-transform">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/10 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA Section */}
      <section className="py-24 bg-gradient-to-br from-secondary/5 via-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-2 border-primary/20 overflow-hidden">
            <CardContent className="p-12 text-center space-y-6">
              <Badge variant="trust" className="mb-2">
                See It In Action
              </Badge>
              <h2 className="text-4xl font-bold">
                Experience a Real Honey Journey
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Explore a sample batch of Vermont Wildflower Honey and see how 
                blockchain and AI work together to verify authenticity.
              </p>
              <Button 
                size="lg" 
                variant="honey"
                className="group"
                onClick={() => navigate("/batch/sample")}
              >
                View Sample Batch
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">AsaliTrace</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 AsaliTrace. Powered by Blockchain.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
