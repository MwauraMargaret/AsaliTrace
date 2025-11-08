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
  batchId: string;
  description: string;
}) => {
  const res = await api.post('/batches/', batchData);
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
  testId: string;
  batchId: string;
  result: string;
}) => {
  const res = await api.post('/labtests/', labData);
  return res.data;
};

// ---------- CERTIFICATES ----------
export const issueCertificate = async (certData: {
  certId: string;
  batchId: string;
  issuer: string;
}) => {
  const res = await api.post('/certificates/', certData);
  return res.data;
};
