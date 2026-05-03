import { z } from 'zod';

/**
 * Zod validation schema for incoming signal payloads.
 * Enforces strict typing at the API boundary.
 */
export const SignalPayloadSchema = z.object({
  componentId: z.string().min(1, 'componentId is required'),
  signalId: z.string().min(1, 'signalId is required'), // Unique hash or UUID
  componentType: z.enum(['API', 'RDBMS', 'CACHE', 'QUEUE', 'NOSQL', 'MCP'], {
    errorMap: () => ({ message: 'componentType must be one of: API, RDBMS, CACHE, QUEUE, NOSQL, MCP' }),
  }),
  errorCode: z.string().min(1, 'errorCode is required'),
  latencyMs: z.number().nonnegative('latencyMs must be non-negative'),
  payload: z.record(z.unknown()).optional().default({}),
});

export type SignalPayload = z.infer<typeof SignalPayloadSchema>;

/**
 * Zod validation schema for RCA creation/update.
 */
export const RCAPayloadSchema = z.object({
  startTime: z.string().datetime({ message: 'startTime must be a valid ISO datetime' }),
  endTime: z.string().datetime({ message: 'endTime must be a valid ISO datetime' }),
  rootCauseCategory: z.enum([
    'Infrastructure',
    'Configuration',
    'Code Bug',
    'Third-party',
    'Human Error',
    'Unknown',
  ]),
  fixApplied: z.string().min(10, 'fixApplied must be at least 10 characters'),
  preventionSteps: z.string().min(10, 'preventionSteps must be at least 10 characters'),
});

export type RCAPayload = z.infer<typeof RCAPayloadSchema>;

/**
 * Zod validation schema for status transition.
 */
export const StatusTransitionSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED']),
});

export type StatusTransition = z.infer<typeof StatusTransitionSchema>;
