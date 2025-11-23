import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBatches } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";


interface Batch {
  id: number;
  batch_id: string;
  honey_type: string;
  producer_name: string;
  status: string;
  created_at?: string;
  has_pending_review?: boolean;
}

const AdministratorBatches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && (user.is_superuser || user.is_staff);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchBatches();
  }, [isAdmin]);

  const fetchBatches = async () => {
    try {
      const data = await getBatches();
      setBatches(data);
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-8">
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">All Honey Batches</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading batches...</div>
          ) : (
            <div className="space-y-4">
              {batches.length === 0 ? (
                <div className="text-center py-8">No batches found.</div>
              ) : (
                batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between hover:shadow-lg cursor-pointer"
                    onClick={() => navigate(`/Administratorbatches/${batch.batch_id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-bold text-lg">Batch ID: {batch.batch_id}</p>
                      <p><strong>Name:</strong> {batch.honey_type}</p>
                      <p><strong>Producer:</strong> {batch.producer_name}</p>
                      <p><strong>Status:</strong> {batch.status}</p>
                      <p><strong>Date Created:</strong> {batch.created_at ? new Date(batch.created_at).toLocaleDateString() : "-"}</p>
                    </div>
                    {/* Pending review indicator */}
                    <div className="flex flex-col items-end gap-2">
                      {batch.has_pending_review && (
                        <Badge variant="destructive">Pending Review</Badge>
                      )}
                      <Badge variant="secondary">View Details</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdministratorBatches;
