import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    isRead: z.enum(['true', 'false']).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    offset: z.string().regex(/^\d+$/).optional(),
  }),
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});
