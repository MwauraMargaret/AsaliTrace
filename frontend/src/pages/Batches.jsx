// frontend/src/pages/Batches.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getBatches, createBatch } from "../services/api";

const Batches = () => {
  const navigate = useNavigate();
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

  // Fetch existing batches on component mount
  useEffect(() => {
    fetchBatches();
  }, []);

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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Batches</h1>

      {/* Create Batch Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          name="batch_id"
          placeholder="Batch ID"
          value={form.batch_id}
          onChange={handleChange}
          required
          className="border p-2 w-full"
        />
        <input
          type="text"
          name="producer_name"
          placeholder="Producer Name"
          value={form.producer_name}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="date"
          name="production_date"
          placeholder="Production Date"
          value={form.production_date}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="text"
          name="honey_type"
          placeholder="Honey Type"
          value={form.honey_type}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="created">Created</option>
          <option value="tested">Tested</option>
          <option value="certified">Certified</option>
          <option value="shipped">Shipped</option>
        </select>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 text-white px-4 py-2 mt-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Batch"}
        </button>
      </form>

      {/* Status Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Statuses</option>
          <option value="created">Created</option>
          <option value="tested">Tested</option>
          <option value="certified">Certified</option>
          <option value="shipped">Shipped</option>
        </select>
        <span className="ml-2 text-sm text-gray-600">
          Showing {filteredBatches.length} of {batches.length} batches
        </span>
      </div>

      {/* Display Batches */}
      <div className="space-y-2">
        {filteredBatches.length === 0 && batches.length === 0 && <p>No batches yet.</p>}
        {filteredBatches.length === 0 && batches.length > 0 && (
          <p>No batches found with status "{statusFilter}".</p>
        )}
        {filteredBatches.map((batch) => (
          <div 
            key={batch.id} 
            className="border p-4 rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/batch/${batch.batch_id}`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">{batch.batch_id}</p>
                <p><strong>Producer:</strong> {batch.producer_name}</p>
                <p><strong>Date:</strong> {batch.production_date}</p>
                <p><strong>Type:</strong> {batch.honey_type}</p>
                <p><strong>Quantity:</strong> {batch.quantity}</p>
                <p><strong>Status:</strong> {batch.status}</p>
                {batch.blockchain_tx_hash && (
                  <p className="text-xs text-green-600">
                    <strong>✓ Blockchain Verified:</strong> {batch.blockchain_tx_hash.substring(0, 20)}...
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/batch/${batch.batch_id}`);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Batches;
