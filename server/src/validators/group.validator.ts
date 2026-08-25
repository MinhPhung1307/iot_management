import { z } from 'zod';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Group name is required'),
    description: z.string().optional().nullable(),
    deviceIds: z.array(z.number().int().positive()).optional(),
  }),
});

export const updateGroupSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    deviceIds: z.array(z.number().int().positive()).optional(),
  }),
});

export const groupIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>['body'];
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>['body'];
