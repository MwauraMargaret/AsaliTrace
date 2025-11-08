import { useState } from "react";
import  fetchBatch  from "@/services/api";

export default function BlockchainVerification() {
  const [batchId, setBatchId] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleVerify = async () => {
    const data = await fetchBatch(batchId);
    setResult(data);
  };

  return (
    <div className="p-6">
      <input
        type="text"
        value={batchId}
        onChange={(e) => setBatchId(e.target.value)}
        placeholder="Enter batch ID"
        className="border p-2 rounded"
      />
      <button onClick={handleVerify} className="ml-2 px-4 py-2 bg-yellow-600 text-white rounded">
        Verify
      </button>
      {result && (
        <div className="mt-4">
          <h3 className="font-bold">Batch Details</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
