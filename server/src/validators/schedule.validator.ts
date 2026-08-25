import { z } from 'zod';

export const createScheduleSchema = z.object({
  body: z.object({
    deviceId: z.number().int().positive('Device ID must be a positive integer'),
    name: z.string().min(1, 'Schedule name is required'),
    command: z.string().min(1, 'Command is required'),
    params: z.record(z.string(), z.any()).optional(),
    cronExpression: z.string().optional().nullable(),
    scheduledTime: z.string().datetime().optional().nullable(),
  }),
});

export const updateScheduleSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    command: z.string().min(1).optional(),
    params: z.record(z.string(), z.any()).optional().nullable(),
    cronExpression: z.string().optional().nullable(),
    scheduledTime: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const scheduleIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});

export const getSchedulesQuerySchema = z.object({
  query: z.object({
    deviceId: z.string().regex(/^\d+$/).optional(),
  }),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>['body'];
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>['body'];
