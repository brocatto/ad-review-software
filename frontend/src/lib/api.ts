import axios from 'axios';
import type {
  AuthResponse,
  Batch,
  BillingStatus,
  Client,
  Creative,
  ActivityLog,
  User,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** Backend error message that means "trial over / no subscription" (see SubscriptionGuard). */
export const SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED';

// Cloudinary returns absolute URLs; local storage returns paths like /uploads/x.jpg
export const getFileUrl = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;

export const getCurrentUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const storeSession = (auth: AuthResponse) => {
  localStorage.setItem('token', auth.access_token);
  localStorage.setItem('user', JSON.stringify(auth.user));
};

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/** Human-readable message from an API error (Nest returns string or string[]). */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response
    ?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || fallback;
};

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
    const status = error.response?.status;
    // A 401 from the login form means wrong credentials, not an expired session
    const isLoginRequest = error.config?.url === '/auth/login';
    if (status === 401 && !isLoginRequest) {
      clearSession();
      window.location.href = '/login';
    }
    // Trial ended / no active subscription: send the user to the billing page once
    if (
      status === 403 &&
      error.response?.data?.message === SUBSCRIPTION_REQUIRED &&
      !window.location.pathname.startsWith('/billing')
    ) {
      window.location.href = '/billing?expired=true';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const signup = async (email: string, password: string, fullName: string) => {
  const { data } = await api.post<{ message: string; email: string }>('/auth/signup', {
    email,
    password,
    fullName,
  });
  return data;
};

export const verifyEmail = async (token: string): Promise<AuthResponse> => {
  const { data } = await api.get('/auth/verify-email', { params: { token } });
  return data;
};

export const resendVerification = async (email: string) => {
  const { data } = await api.post<{ message: string }>('/auth/resend-verification', { email });
  return data;
};

export const googleAuth = async (idToken: string): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/google', { idToken });
  return data;
};

export const forgotPassword = async (email: string) => {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', {
    token,
    newPassword,
  });
  return data;
};

export const verifyToken = async () => {
  const { data } = await api.get('/auth/verify');
  return data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  await api.patch('/auth/password', { currentPassword, newPassword });
};

// Billing
export const getBillingStatus = async (): Promise<BillingStatus> => {
  const { data } = await api.get('/billing/status');
  return data;
};

export const createCheckout = async (): Promise<{ url: string | null }> => {
  const { data } = await api.post('/billing/checkout');
  return data;
};

export const createPortalSession = async (): Promise<{ url: string }> => {
  const { data } = await api.post('/billing/portal');
  return data;
};

// Users (admin only)
export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/users');
  return data;
};

export const createUser = async (user: {
  email: string;
  fullName: string;
  password: string;
  role: User['role'];
}): Promise<User> => {
  const { data } = await api.post('/users', user);
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

export const getCreativeActivityLogs = async (creativeId: string): Promise<ActivityLog[]> => {
  const { data } = await api.get(`/activity-logs/creative/${creativeId}`);
  return data;
};

export const getHistory = async (before?: string, limit = 50): Promise<ActivityLog[]> => {
  const { data } = await api.get('/activity-logs', { params: { before, limit } });
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
