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

// Handle expired token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only redirect to /auth for endpoints that require authentication
    const publicEndpoints = [
      '/batches/journey/',
      '/batches/statistics/',
      '/auth/login/',
      '/auth/register/'
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      error?.config?.url?.includes(endpoint)
    );
    
    if (error.response?.status === 401 && !isPublicEndpoint) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth';
    }
    // For public endpoints, just reject with error (no redirect)
    return Promise.reject(error);
  }
);

export default api;

/* -------------------------------------------------------------------------- */
/*                        AsaliTrace API Service Layer                     */
/* -------------------------------------------------------------------------- */

// ---------- ADMIN ACTIONS ----------
export const flagLabTest = async (testId: number, reason: string, flaggedBy: string) => {
  const res = await api.post(`/labtests/${testId}/flag/`, { 
    reason, 
    flagged_by: flaggedBy 
  });
  return res.data;
};

export const flagCertificate = async (certId: number, reason: string, flaggedBy: string) => {
  const res = await api.post(`/certificates/${certId}/flag/`, { 
    reason, 
    flagged_by: flaggedBy 
  });
  return res.data;
};

export const verifyCertificate = async (certId: number, verifiedBy: string) => {
  const res = await api.post(`/certificates/${certId}/verify/`, { 
    verified_by: verifiedBy 
  });
  return res.data;
};

export const recordLabTestOnChain = async (testId: number) => {
  const res = await api.post(`/labtests/${testId}/record-on-chain/`);
  return res.data;
};

export const recordCertificateOnChain = async (certId: number) => {
  const res = await api.post(`/certificates/${certId}/record-on-chain/`);
  return res.data;
};

// ---------- BATCHES ----------
export const createBatch = async (batchData: {
  batch_id: string;
  producer_name: string;
  production_date: string;
  honey_type: string;
  quantity: string | number;
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
  return res.data;
};

export const getBatches = async () => {
  const res = await api.get('/batches/');
  return res.data;
};

export const getBatchById = async (id: string) => {
  try {
    // First try direct ID lookup
    const res = await api.get(`/batches/${id}/`);
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // If 404, try to find by batch_id
      const allBatches = await getBatches();
      const batch = allBatches.find((b: any) => b.batch_id === id);
      if (batch) {
        return batch;
      }
    }
    throw error;
  }
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

// ---------- AUTH ----------
export const login = async (credentials: { email: string; password: string }) => {
  const res = await api.post('/auth/login/', credentials);
  return res.data;
};

export const register = async (userData: { 
  email: string; 
  password: string; 
  first_name: string; 
  last_name: string; 
}) => {
  const res = await api.post('/auth/register/', userData);
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await api.get('/auth/user/');
  return res.data;
};

// ---------- BLOCKCHAIN ----------
export const verifyBatchOnBlockchain = async (batchId: string) => {
  const res = await api.get(`/batches/verify-batch/${batchId}/`);
  return res.data;
};

export const testBlockchainConnection = async () => {
  const res = await api.get('/batches/test-blockchain-connection/');
  return res.data;
};