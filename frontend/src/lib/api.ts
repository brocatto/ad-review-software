import axios from 'axios';
import type { AuthResponse, Batch, Client, Creative, ActivityLog } from '../types';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const verifyToken = async () => {
  const { data } = await api.get('/auth/verify');
  return data;
};

// Clients
export const getClients = async (): Promise<Client[]> => {
  const { data } = await api.get('/clients');
  return data;
};

export const createClient = async (client: Partial<Client>): Promise<Client> => {
  const { data } = await api.post('/clients', client);
  return data;
};

// Batches
export const getBatches = async (): Promise<Batch[]> => {
  const { data } = await api.get('/batches');
  return data;
};

export const getBatch = async (id: string): Promise<Batch> => {
  const { data } = await api.get(`/batches/${id}`);
  return data;
};

export const createBatch = async (batch: { name: string; clientId: string }): Promise<Batch> => {
  const { data } = await api.post('/batches', batch);
  return data;
};

export const deleteBatch = async (id: string): Promise<void> => {
  await api.delete(`/batches/${id}`);
};

// Creatives
export const uploadCreatives = async (batchId: string, files: File[]): Promise<Creative[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  const { data } = await api.post(`/creatives/batch/${batchId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const updateCreativeName = async (id: string, name: string): Promise<Creative> => {
  const { data } = await api.patch(`/creatives/${id}/name`, { name });
  return data;
};

export const updateAdjustmentStatus = async (
  id: string,
  status: string,
  notes?: string
): Promise<void> => {
  await api.patch(`/creatives/${id}/adjustment-status`, { status, notes });
};

export const deleteCreative = async (id: string): Promise<void> => {
  await api.delete(`/creatives/${id}`);
};

export const uploadRevision = async (creativeId: string, file: File): Promise<Creative> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/creatives/${creativeId}/revision`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Activity Logs
export const getActivityLogs = async (batchId: string): Promise<ActivityLog[]> => {
  const { data } = await api.get(`/activity-logs/batch/${batchId}`);
  return data;
};

// Public (Client Approval)
export const getPublicBatch = async (accessToken: string): Promise<Batch> => {
  const { data } = await api.get(`/public/batch/${accessToken}`);
  return data;
};

export const approveCreative = async (accessToken: string, creativeId: string): Promise<void> => {
  await api.post(`/public/batch/${accessToken}/approve`, { creativeId });
};

export const rejectCreative = async (
  accessToken: string,
  creativeId: string,
  feedback?: string
): Promise<void> => {
  await api.post(`/public/batch/${accessToken}/reject`, { creativeId, feedback });
};

export default api;
