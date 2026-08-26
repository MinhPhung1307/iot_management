export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  department?: string;
  location?: string;
  clearanceLevel: number;
  permissions?: string[];
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

// =====================================================
// ABAC Policy Types
// =====================================================

export interface PolicyCondition {
  id?: number;
  policyId?: number;
  subjectAttr?: string | null;
  resourceAttr?: string | null;
  actionAttr?: string | null;
  environmentAttr?: string | null;
  operator: string;
  value: string;
}

export interface Policy {
  id: number;
  name: string;
  description?: string | null;
  effect: 'permit' | 'deny';
  priority: number;
  isActive: boolean;
  conditions: PolicyCondition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePolicyInput {
  name: string;
  description?: string;
  effect: 'permit' | 'deny';
  priority?: number;
  conditions?: PolicyCondition[];
}

export interface UpdatePolicyInput {
  name?: string;
  description?: string;
  effect?: 'permit' | 'deny';
  priority?: number;
  isActive?: boolean;
  conditions?: PolicyCondition[];
}
