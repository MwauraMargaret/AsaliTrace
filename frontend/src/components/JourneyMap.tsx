import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Truck, Store } from "lucide-react";

interface JourneyStep {
  id: number;
  title: string;
  location: string;
  date: string;
  verified: boolean;
  icon: React.ReactNode;
}

const journeySteps: JourneyStep[] = [
  {
    id: 1,
    title: "Harvested",
    location: "Meadowview Apiary, Vermont",
    date: "Oct 15, 2025",
    verified: true,
    icon: <MapPin className="w-5 h-5" />
  },
  {
    id: 2,
    title: "Quality Tested",
    location: "HoneyTrace AI Lab",
    date: "Oct 16, 2025",
    verified: true,
    icon: <Package className="w-5 h-5" />
  },
  {
    id: 3,
    title: "Packaged",
    location: "Local Processing Center",
    date: "Oct 18, 2025",
    verified: true,
    icon: <Package className="w-5 h-5" />
  },
  {
    id: 4,
    title: "Distributed",
    location: "Regional Warehouse",
    date: "Oct 20, 2025",
    verified: true,
    icon: <Truck className="w-5 h-5" />
  },
  {
    id: 5,
    title: "Retail",
    location: "GreenMarket Stores",
    date: "Oct 22, 2025",
    verified: true,
    icon: <Store className="w-5 h-5" />
  }
];

const JourneyMap = () => {
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
                  <p className="text-xs text-muted-foreground">
                    {step.date}
                  </p>
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
