import { z } from 'zod';

export const sendCommandSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
  body: z.object({
    command: z.string().min(1, 'Command is required'),
    params: z.record(z.string(), z.any()).optional(),
  }),
});

export const getCommandHistorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
    offset: z.string().regex(/^\d+$/).optional(),
  }),
});

export type SendCommandInput = z.infer<typeof sendCommandSchema>['body'];
