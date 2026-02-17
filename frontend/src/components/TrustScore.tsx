import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, TrendingUp } from "lucide-react";

interface TrustScoreProps {
  score: number;
  factors: string[];
}

const TrustScore = ({ score, factors }: TrustScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 95) return "text-accent";
    if (score >= 80) return "text-secondary";
    return "text-primary";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 95) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    return "Fair";
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Score Display */}
          <div className="text-center space-y-2">
            <Badge variant="trust" className="mb-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trust Score
            </Badge>
            <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
              {score}%
            </div>
            <p className="text-sm text-muted-foreground">
              This honey's journey looks {getScoreLabel(score).toLowerCase()} — traceable and authentic!
            </p>
          </div>

          {/* Score Bar */}
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-1000"
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Trust Factors */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Verified Factors:</h4>
            <div className="grid gap-2">
              {factors.map((factor, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sweet message */}
          <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
            <p className="text-sm text-center">
              <span className="font-medium">Sweet!</span> This honey has been verified 
              through blockchain records and AI quality analysis.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrustScore;
