// frontend/src/pages/Batches.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getBatches, createBatch } from "../services/api";
import { useAuth } from "@/contexts/AuthContext";

const Batches = ({ adminView = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    batch_id: "",
    producer_name: "",
    production_date: "",
    honey_type: "",
    quantity: "",
    status: "created",
    blockchain_tx_hash: ""
  });

  useEffect(() => {
    fetchBatches();
  }, []);
  // Only show user batches if not adminView
  useEffect(() => {
    if (!adminView && user) {
      setFilteredBatches(batches.filter(batch => batch.producer_name === user.email));
    }
  }, [batches, adminView, user]);

  const fetchBatches = async () => {
    try {
      const data = await getBatches();
      setBatches(data);
      setFilteredBatches(data);
    } catch (err) {
      console.error("Error fetching batches:", err);
    }
  };

  // Filter batches by status
  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredBatches(batches);
    } else {
      setFilteredBatches(batches.filter(batch => batch.status === statusFilter));
    }
  }, [statusFilter, batches]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Show loading toast
      const loadingToast = toast.loading("Creating batch...");
      
      const newBatch = await createBatch(form);
      
      // Update state
      setBatches([...batches, newBatch]);
      
      // Reset form
      setForm({
        batch_id: "",
        producer_name: "",
        production_date: "",
        honey_type: "",
        quantity: "",
        status: "created", // Reset to default
        blockchain_tx_hash: ""
      });
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success message
      if (newBatch.blockchain_tx_hash) {
        toast.success("Batch created successfully!", {
          description: `Batch ${newBatch.batch_id} has been saved and recorded on the blockchain. Transaction: ${newBatch.blockchain_tx_hash.substring(0, 20)}...`,
          duration: 5000,
        });
      } else if (newBatch.blockchain_warning) {
        toast.warning("Batch created but blockchain write failed", {
          description: `Batch ${newBatch.batch_id} was saved to the database, but could not be recorded on the blockchain. ${newBatch.blockchain_warning}`,
          duration: 6000,
        });
      } else {
        toast.success("Batch created successfully!", {
          description: `Batch ${newBatch.batch_id} has been saved.`,
          duration: 4000,
        });
      }
    } catch (err) {
      console.error("Error creating batch:", err);
      
      // Log full error details for debugging
      if (err?.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
        console.error("Request payload:", form);
      }
      
      // Show error message with detailed validation errors
      let errorMessage = err?.response?.data?.message || 
                        err?.message || 
                        "Failed to create batch. Please try again.";
      
      // If validation errors, show field-specific errors
      if (err?.response?.data && typeof err.response.data === 'object') {
        const validationErrors = Object.entries(err.response.data)
          .filter(([key]) => key !== 'message' && key !== 'error')
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('; ');
        
        if (validationErrors) {
          errorMessage = `Validation errors: ${validationErrors}`;
        }
      }
      
      toast.error("Failed to create batch", {
        description: errorMessage,
        duration: 8000, // Longer duration for detailed errors
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Honey Batches</h1>
          <p className="text-lg text-muted-foreground">Track, create, and view your honey batches. Blockchain verified for trust and transparency.</p>
        </div>

        {/* Create Batch Form (only for user dashboard, not adminView) */}
        {!adminView && (
          <form onSubmit={handleSubmit} className="mb-8 max-w-2xl mx-auto bg-card rounded-xl shadow p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="batch_id" placeholder="Batch ID" value={form.batch_id} onChange={handleChange} required className="border p-2 rounded w-full" />
              <input type="text" name="producer_name" placeholder="Producer Name" value={form.producer_name} onChange={handleChange} className="border p-2 rounded w-full" />
              <input type="date" name="production_date" placeholder="Production Date" value={form.production_date} onChange={handleChange} className="border p-2 rounded w-full" />
              <input type="text" name="honey_type" placeholder="Honey Type" value={form.honey_type} onChange={handleChange} className="border p-2 rounded w-full" />
              <input type="number" name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} className="border p-2 rounded w-full" />
              <select name="status" value={form.status} onChange={handleChange} className="border p-2 rounded w-full">
                <option value="created">Created</option>
                <option value="tested">Tested</option>
                <option value="certified">Certified</option>
                <option value="shipped">Shipped</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed w-full">
              {isSubmitting ? "Creating..." : "Create Batch"}
            </button>
          </form>
        )}

        {/* Status Filter */}
        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Filter by Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border p-2 rounded">
              <option value="all">All Statuses</option>
              <option value="created">Created</option>
              <option value="tested">Tested</option>
              <option value="certified">Certified</option>
              <option value="shipped">Shipped</option>
            </select>
          </div>
          <span className="text-sm text-muted-foreground">Showing {filteredBatches.length} of {batches.length} batches</span>
        </div>

        {/* Display Batches */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.length === 0 && batches.length === 0 && <p className="col-span-full text-center text-muted-foreground">No batches yet.</p>}
          {filteredBatches.length === 0 && batches.length > 0 && (
            <p className="col-span-full text-center text-muted-foreground">No batches found with status "{statusFilter}".</p>
          )}
          {filteredBatches.map((batch) => (
            <div key={batch.id} className="bg-card border border-border rounded-xl shadow hover:shadow-lg transition-shadow cursor-pointer p-6 flex flex-col justify-between" onClick={() => navigate(`/batch/${batch.batch_id}`)}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{batch.batch_id}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${batch.status === 'certified' ? 'bg-green-100 text-green-700' : batch.status === 'tested' ? 'bg-yellow-100 text-yellow-700' : batch.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>{batch.status}</span>
                </div>
                <p className="text-sm"><strong>Producer:</strong> {batch.producer_name}</p>
                <p className="text-sm"><strong>Date:</strong> {batch.production_date}</p>
                <p className="text-sm"><strong>Type:</strong> {batch.honey_type}</p>
                <p className="text-sm"><strong>Quantity:</strong> {batch.quantity}</p>
                {batch.blockchain_tx_hash && (
                  <span className="inline-block mt-2 px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-semibold">
                    ✓ Blockchain Verified
                  </span>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); navigate(`/batch/${batch.batch_id}`); }} className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-secondary w-full">View Details</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Batches;
