import { z } from 'zod';

const deviceTypeEnum = z.enum(['sensor', 'actuator', 'gateway']);
const deviceStatusEnum = z.enum(['online', 'offline', 'warning', 'error']);

export const createDeviceSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Device name is required'),
    type: deviceTypeEnum,
    location: z.string().optional(),
    parameters: z.record(z.string(), z.any()).optional(),
  }),
});

export const updateDeviceSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    type: deviceTypeEnum.optional(),
    location: z.string().optional().nullable(),
    status: deviceStatusEnum.optional(),
    parameters: z.record(z.string(), z.any()).optional(),
  }),
});

export const getDevicesQuerySchema = z.object({
  query: z.object({
    type: deviceTypeEnum.optional(),
    status: deviceStatusEnum.optional(),
    location: z.string().optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const deviceIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});

export const getDeviceDataQuerySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>['body'];
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>['body'];
