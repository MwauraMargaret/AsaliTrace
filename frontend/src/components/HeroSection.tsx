import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-honey.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with honey gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-muted" />
      
      {/* Honeycomb pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="honeycomb" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
              <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="currentColor" strokeWidth="1"/>
              <path d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#honeycomb)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-left space-y-8">
            <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full border border-secondary/30">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">Powered by Blockchain + AI</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Every Jar Tells a{" "}
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Sweet Story
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-xl">
              HoneyTrace uses blockchain technology and AI to reveal the authentic journey 
              of your honey—from the hive to your home. Trust the trace. Taste the truth.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" variant="honey" className="group">
                Trace Your Honey
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline">
                <Shield className="w-4 h-4" />
                How It Works
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">Verified Authentic</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-primary">2,500+</div>
                <div className="text-sm text-muted-foreground">Traced Batches</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-primary">150+</div>
                <div className="text-sm text-muted-foreground">Partner Beekeepers</div>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-3xl blur-3xl" />
            <img 
              src={heroImage} 
              alt="Golden honeycomb with honey" 
              className="relative rounded-3xl shadow-2xl w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
