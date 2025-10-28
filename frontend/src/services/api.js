const API_BASE = 'http://localhost:8000/api';

export const getBatches = async () => {
  try {
    const response = await fetch(`${API_BASE}/batches/`);
    const data = await response.json();
    return { data }; // Match what your Dashboard expects
  } catch (error) {
    console.error('API Error:', error);
    return { data: [] };
  }
};