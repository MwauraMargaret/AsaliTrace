// frontend/src/pages/Batches.jsx
import React, { useState, useEffect } from "react";
import { getBatches, createBatch } from "../services/api";

const Batches = () => {
  const [batches, setBatches] = useState([]);
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
    try {
      const newBatch = await createBatch(form);
      setBatches([...batches, newBatch]); // update state
      setForm({ // reset form
        batch_id: "",
        producer_name: "",
        production_date: "",
        honey_type: "",
        quantity: "",
        status: "",
        blockchain_tx_hash: ""
      });
    } catch (err) {
      console.error("Error creating batch:", err);
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
          className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
        >
          Create Batch
        </button>
      </form>

      {/* Display Batches */}
      <div className="space-y-2">
        {batches.length === 0 && <p>No batches yet.</p>}
        {batches.map((batch) => (
          <div key={batch.id} className="border p-2 rounded">
            <p><strong>ID:</strong> {batch.batch_id}</p>
            <p><strong>Producer:</strong> {batch.producer_name}</p>
            <p><strong>Date:</strong> {batch.production_date}</p>
            <p><strong>Type:</strong> {batch.honey_type}</p>
            <p><strong>Quantity:</strong> {batch.quantity}</p>
            <p><strong>Status:</strong> {batch.status}</p>
            <p><strong>Blockchain Tx:</strong> {batch.blockchain_tx_hash}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Batches;
