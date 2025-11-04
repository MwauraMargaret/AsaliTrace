import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Award } from "lucide-react";
import beehiveImage from "@/assets/beehive-meadow.jpg";

const BeekeeperProfile = () => {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-3xl flex-shrink-0">
            🐝
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-bold text-lg">Sarah & Tom Martinez</h3>
                <p className="text-sm text-muted-foreground">Third-generation beekeepers</p>
              </div>
              <Badge variant="verified">
                Verified
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Meadowview Apiary, Vermont</span>
            </div>
          </div>
        </div>

        {/* Apiary Image */}
        <div className="rounded-xl overflow-hidden">
          <img 
            src={beehiveImage} 
            alt="Beehive meadow" 
            className="w-full h-48 object-cover"
          />
        </div>

        {/* About */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">About the Apiary</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our family has been keeping bees in the Green Mountains of Vermont for over 60 years. 
            We practice sustainable, chemical-free beekeeping and let our bees forage naturally 
            across wildflower meadows and clover fields.
          </p>
        </div>

        {/* Certifications */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Certifications
          </h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Organic Certified</Badge>
            <Badge variant="secondary">Fair Trade</Badge>
            <Badge variant="secondary">Bee-Friendly</Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">45</div>
            <div className="text-xs text-muted-foreground">Active Hives</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">12</div>
            <div className="text-xs text-muted-foreground">Years on Chain</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">500+</div>
            <div className="text-xs text-muted-foreground">Batches Traced</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BeekeeperProfile;
