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
