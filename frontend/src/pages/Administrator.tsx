
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";


const Administrator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && (user.is_superuser || user.is_staff);

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-card to-muted">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold mb-2">Administrator Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-center">
          <Badge variant="destructive" className="mb-4 text-lg">Admin Actions</Badge>
          <p className="text-xl text-muted-foreground mb-6">
            Welcome, {user?.email}. Review and manage all honey batches, lab tests, and certificates.
          </p>
          <Button 
            size="lg" 
            variant="destructive"
            className="group"
            onClick={() => navigate('/Administratorbatches')}
          >
            View Batches
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Administrator;
