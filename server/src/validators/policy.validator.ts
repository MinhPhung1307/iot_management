import { z } from 'zod';

const policyConditionSchema = z.object({
  subjectAttr: z.string().optional().nullable(),
  resourceAttr: z.string().optional().nullable(),
  actionAttr: z.string().optional().nullable(),
  environmentAttr: z.string().optional().nullable(),
  operator: z.enum(['eq', 'neq', 'in', 'not_in', 'gt', 'gte', 'lt', 'lte', 'contains', 'starts_with', 'ends_with']),
  value: z.string(),
}).refine(
  (data) => {
    // At least one attribute must be specified
    return data.subjectAttr || data.resourceAttr || data.actionAttr || data.environmentAttr;
  },
  { message: 'At least one attribute (subjectAttr, resourceAttr, actionAttr, environmentAttr) must be specified' }
);

export const createPolicySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  effect: z.enum(['permit', 'deny']),
  priority: z.number().int().min(0).max(1000).optional().default(0),
  conditions: z.array(policyConditionSchema).optional().default([]),
});

export const updatePolicySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  effect: z.enum(['permit', 'deny']).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
  conditions: z.array(policyConditionSchema).optional(),
});

export const policyIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
