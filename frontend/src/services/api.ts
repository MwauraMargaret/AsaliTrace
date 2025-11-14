// src/services/api.ts
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//  Handle expired token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;

/* -------------------------------------------------------------------------- */
/*                        AsaliTrace API Service Layer                     */
/* -------------------------------------------------------------------------- */

// ---------- BATCHES ----------
export const createBatch = async (batchData: {
  batch_id: string;
  producer_name: string;
  production_date: string;
  honey_type: string;
  quantity: string;
  status?: string;
}) => {
  // Remove any read-only fields that shouldn't be sent
  const { blockchain_tx_hash, created_by, owner, created_at, updated_at, ...cleanData } = batchData as any;
  
  // Ensure quantity is a string (convert number if needed)
  const payload = {
    ...cleanData,
    quantity: String(cleanData.quantity),
  };
  
  const res = await api.post('/batches/', payload);
  return res.data; // includes blockchain_tx_hash if backend integrated
};

export const getBatches = async () => {
  const res = await api.get('/batches/');
  return res.data;
};

export const getBatchById = async (id: string) => {
  const res = await api.get(`/batches/${id}/`);
  return res.data;
};

// ---------- LAB TESTS ----------
export const createLabTest = async (labData: {
  batch: number; // Batch ID (foreign key)
  test_type: string;
  result: string;
  tested_by: string;
  test_date: string; // YYYY-MM-DD format
}) => {
  const res = await api.post('/labtests/', labData);
  return res.data;
};

export const getLabTests = async (batchId?: number) => {
  const url = batchId ? `/labtests/?batch=${batchId}` : '/labtests/';
  const res = await api.get(url);
  return res.data;
};

export const getLabTestById = async (id: string | number) => {
  const res = await api.get(`/labtests/${id}/`);
  return res.data;
};

// ---------- CERTIFICATES ----------
export const issueCertificate = async (certData: {
  batch: number; // Batch ID (foreign key)
  certificate_id: string;
  issued_by: string;
  issue_date: string; // YYYY-MM-DD format
  expiry_date: string; // YYYY-MM-DD format
}) => {
  const res = await api.post('/certificates/', certData);
  return res.data;
};

export const getCertificates = async (batchId?: number) => {
  const url = batchId ? `/certificates/?batch=${batchId}` : '/certificates/';
  const res = await api.get(url);
  return res.data;
};

export const getCertificateById = async (id: string | number) => {
  const res = await api.get(`/certificates/${id}/`);
  return res.data;
};

// ---------- STATISTICS ----------
export const getStatistics = async () => {
  const res = await api.get('/batches/statistics/');
  return res.data;
};

// ---------- JOURNEY/AUDIT TRAIL ----------
export const getBatchJourney = async (batchId: string | number) => {
  const res = await api.get(`/batches/journey/${batchId}/`);
  return res.data;
};
