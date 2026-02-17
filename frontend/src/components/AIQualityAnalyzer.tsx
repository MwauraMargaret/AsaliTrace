import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

interface QualityMetric {
  name: string;
  value: number;
  label: string;
}

const qualityMetrics: QualityMetric[] = [
  { name: "Purity", value: 98, label: "Pure wildflower honey" },
  { name: "Moisture Content", value: 95, label: "Optimal 17.2%" },
  { name: "Color Grade", value: 92, label: "Light Amber" },
  { name: "Enzyme Activity", value: 96, label: "High diastase" }
];

const AIQualityAnalyzer = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Quality Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Grade */}
        <div className="text-center p-6 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl border border-primary/20">
          <Badge variant="trust" className="mb-3">
            AI Verified
          </Badge>
          <div className="text-5xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent mb-2">
            A+
          </div>
          <p className="text-sm text-muted-foreground">
            Premium Grade • Raw & Unfiltered
          </p>
        </div>

        {/* Quality Metrics */}
        <div className="space-y-4">
          {qualityMetrics.map((metric) => (
            <div key={metric.name} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{metric.name}</span>
                <span className="text-muted-foreground">{metric.value}%</span>
              </div>
              <Progress value={metric.value} className="h-2" />
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* AI Insights */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="font-semibold text-sm">AI Insights:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>No additives or adulterants detected</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Pollen analysis confirms wildflower origin</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Natural enzymes indicate minimal processing</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIQualityAnalyzer;
