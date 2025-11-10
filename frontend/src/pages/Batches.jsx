// frontend/src/pages/Batches.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getBatches, createBatch } from "../services/api";

const Batches = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    batch_id: "",
    producer_name: "",
    production_date: "",
    honey_type: "",
    quantity: "",
    status: "",
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
    } catch (err) {
      console.error("Error fetching batches:", err);
    }
  };

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
        status: "",
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
      
      // Show error message
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          err?.message || 
                          "Failed to create batch. Please try again.";
      
      toast.error("Failed to create batch", {
        description: errorMessage,
        duration: 5000,
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
        <input
          type="text"
          name="status"
          placeholder="Status"
          value={form.status}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 text-white px-4 py-2 mt-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Batch"}
        </button>
      </form>

      {/* Display Batches */}
      <div className="space-y-2">
        {batches.length === 0 && <p>No batches yet.</p>}
        {batches.map((batch) => (
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
