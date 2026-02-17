/**
 * Utility functions for navigating to batch pages
 */

import { getBatches } from "@/services/api";

/**
 * Navigate to the first available batch
 * Falls back to /batches if no batches exist
 */
export const navigateToFirstBatch = async (navigate: (path: string) => void) => {
  try {
    const batches = await getBatches();
    if (batches && batches.length > 0) {
      const firstBatch = batches[0];
      navigate(`/batch/${firstBatch.batch_id}`);
    } else {
      navigate("/batches");
    }
  } catch (error) {
    console.error("Failed to fetch batches:", error);
    navigate("/batches");
  }
};

/**
 * Navigate to a specific batch by ID
 * Falls back to /batches if batch not found
 */
export const navigateToBatch = async (
  batchId: string,
  navigate: (path: string) => void
) => {
  try {
    navigate(`/batch/${batchId}`);
  } catch (error) {
    console.error("Failed to navigate to batch:", error);
    navigate("/batches");
  }
};

/**
 * Get the first batch ID for navigation
 */
export const getFirstBatchId = async (): Promise<string | null> => {
  try {
    const batches = await getBatches();
    if (batches && batches.length > 0) {
      return batches[0].batch_id;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch batches:", error);
    return null;
  }
};

