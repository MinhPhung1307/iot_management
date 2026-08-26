import { Request } from 'express';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: User;
  accessDecision?: AccessDecision;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export type DeviceType = 'sensor' | 'actuator' | 'gateway';
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  WARNING = 'warning',
  ERROR = 'error',
}
export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';
export type AlertSeverity = 'info' | 'warning' | 'critical';

// =====================================================
// ABAC Types
// =====================================================

export interface SubjectAttributes {
  userId: number;
  role: string;
  department?: string;
  clearanceLevel: number;
}

export interface ResourceAttributes {
  id?: number;
  type: string;
  ownerId?: number;
  groupId?: number;
  sensitivity?: string;
}

export interface EnvironmentAttributes {
  timestamp: Date;
  ipAddress: string;
  isBusinessHours: boolean;
}

export interface AccessRequest {
  subject: SubjectAttributes;
  resource: ResourceAttributes;
  action: string;
  environment: EnvironmentAttributes;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  policyId?: number;
}
