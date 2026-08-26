import { Response, NextFunction } from 'express';
import { AuthRequest, AccessRequest } from '../types';
import { PolicyEngine } from '../domain/policies/PolicyEngine';
import Device from '../models/Device';
import DeviceGroup from '../models/DeviceGroup';
import Schedule from '../models/Schedule';

// Helper: check if current time is business hours (9 AM - 6 PM, Mon-Fri)
function isBusinessHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  return hour >= 9 && hour < 18 && day >= 1 && day <= 5;
}

// Helper: get resource owner based on type and id
async function getResourceOwner(type: string, id?: string): Promise<{ ownerId?: number; department?: string } | undefined> {
  if (!id) return undefined;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) return undefined;

  try {
    switch (type) {
      case 'group': {
        const group = await DeviceGroup.findByPk(numericId);
        if (!group) return undefined;
        return { ownerId: (group as any).createdBy };
      }
      case 'schedule': {
        const schedule = await Schedule.findByPk(numericId);
        if (!schedule) return undefined;
        return { ownerId: (schedule as any).createdBy };
      }
      case 'device': {
        // Devices don't have owner, but might have location (used as department proxy)
        const device = await Device.findByPk(numericId);
        if (!device) return undefined;
        return { department: device.location || undefined };
      }
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

export const abac = (resourceType: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const policyEngine = req.app.get('policyEngine') as PolicyEngine;
      
      if (!policyEngine) {
        res.status(500).json({ message: 'Policy engine not configured' });
        return;
      }

      // Get resource owner info if we have an ID
      const resourceOwner = await getResourceOwner(resourceType, req.params.id);

      // Build access request
      const accessRequest: AccessRequest = {
        subject: {
          userId: req.user!.id,
          role: req.user!.role,
          department: (req.user as any).department || undefined,
          clearanceLevel: (req.user as any).clearanceLevel || 1,
        },
        resource: {
          id: req.params.id ? parseInt(req.params.id, 10) : undefined,
          type: resourceType,
          ownerId: resourceOwner?.ownerId,
          groupId: resourceType === 'group' ? parseInt(req.params.id, 10) : undefined,
          sensitivity: 'internal', // Default sensitivity level
        },
        action,
        environment: {
          timestamp: new Date(),
          ipAddress: req.ip || req.connection.remoteAddress || '',
          isBusinessHours: isBusinessHours(),
        },
      };

      // Evaluate policy
      const decision = await policyEngine.evaluate(accessRequest);

      // Attach decision to request for audit/logging
      req.accessDecision = decision;

      if (!decision.allowed) {
        res.status(403).json({
          message: 'Access denied',
          reason: decision.reason,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('ABAC evaluation error:', error);
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

// Backward compatible: admin always passes through
export const abacOrRbac = (resourceType: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Quick check: admin bypasses ABAC (backward compatibility)
    if (req.user?.role === 'admin') {
      return next();
    }

    // Full ABAC evaluation for non-admin
    return abac(resourceType, action)(req, res, next);
  };
};
