import { Request } from 'express';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: User;
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
export type UserRole = 'admin' | 'user';
export type AlertSeverity = 'info' | 'warning' | 'critical';
