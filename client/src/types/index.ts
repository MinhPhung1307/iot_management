export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Device {
  id: number;
  name: string;
  type: 'sensor' | 'actuator' | 'gateway';
  location: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  lastSeen: string | null;
  parameters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceData {
  id: number;
  deviceId: number;
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  data: Record<string, any>;
}

export interface DeviceStats {
  total: number;
  byStatus: {
    online: number;
    offline: number;
    warning: number;
    error: number;
  };
  byType: Array<{ type: string; count: number }>;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
