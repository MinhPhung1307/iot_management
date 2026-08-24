import axios from 'axios';
import { AuthResponse, Device, DeviceData, DeviceStats, Pagination } from '../types';

const api = axios.create({
  baseURL: '/api',
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name }),
  getMe: () => api.get<{ user: any }>('/auth/me'),
};

export const deviceAPI = {
  getAll: (params?: Record<string, any>) =>
    api.get<{ devices: Device[]; pagination: Pagination }>('/devices', { params }),
  getById: (id: number) =>
    api.get<{ device: Device }>(`/devices/${id}`),
  create: (data: Partial<Device>) =>
    api.post<{ device: Device }>('/devices', data),
  update: (id: number, data: Partial<Device>) =>
    api.put<{ device: Device }>(`/devices/${id}`, data),
  delete: (id: number) =>
    api.delete(`/devices/${id}`),
  getData: (id: number, params?: Record<string, any>) =>
    api.get<{ data: DeviceData[] }>(`/devices/${id}/data`, { params }),
  sendCommand: (id: number, command: string, params?: Record<string, any>) =>
    api.post<{ device: Device }>(`/devices/${id}/command`, { command, params }),
  getStats: () =>
    api.get<DeviceStats>('/devices/stats'),
};

export default api;
