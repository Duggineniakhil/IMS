import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { signalQueue } from '../queues/signalQueue';
import { SignalPayloadSchema, SignalPayload } from '../schemas/validation';
import { ZodError } from 'zod';

import { redis } from '../config/redis';

/**
 * Signal ingestion API routes.
 * POST /api/signals — Accepts signal payloads and enqueues for async processing.
 */
export async function signalRoutes(fastify: FastifyInstance): Promise<void> {
  // Simple Redis Fixed-Window Rate Limiter
  const checkRateLimit = async (ip: string): Promise<boolean> => {
    const key = `ratelimit:${ip}`;
    const current = await redis.incr(key);
    if (current === 1) await redis.expire(key, 1); // 1 second window
    return current <= 100; // max 100 requests per second per IP
  };

  /**
   * POST /api/signals
   */
  fastify.post(
    '/api/signals',
    async (
      request: FastifyRequest<{ Body: SignalPayload }>,
      reply: FastifyReply
    ) => {
      try {
        if (!(await checkRateLimit(request.ip))) {
          return reply.status(429).send({ error: 'Too Many Requests' });
        }

        // Validate payload with Zod
        const validated = SignalPayloadSchema.parse(request.body);

        // Enqueue signal (non-blocking)
        await signalQueue.add('process-signal', validated, {
          priority: validated.componentType === 'RDBMS' ? 1 : 3,
        });

        return reply.status(202).send({
          status: 'accepted',
          message: 'Signal queued for processing',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return reply.status(400).send({
            status: 'error',
            message: 'Validation failed',
            errors: error.errors,
          });
        }
        throw error;
      }
    }
  );

  /**
   * POST /api/signals/batch
   * Accepts an array of signal payloads for batch ingestion.
   */
  fastify.post(
    '/api/signals/batch',
    async (
      request: FastifyRequest<{ Body: SignalPayload[] }>,
      reply: FastifyReply
    ) => {
      if (!(await checkRateLimit(request.ip))) {
        return reply.status(429).send({ error: 'Too Many Requests' });
      }

      const signals = request.body;

      if (!Array.isArray(signals)) {
        return reply.status(400).send({
          status: 'error',
          message: 'Body must be an array of signals',
        });
      }

      const validJobs = signals.map((signal, idx) => {
        try {
          const validated = SignalPayloadSchema.parse(signal);
          return {
            name: 'process-signal',
            data: validated,
            opts: { priority: validated.componentType === 'RDBMS' ? 1 : 3 },
          };
        } catch {
          return null;
        }
      }).filter(Boolean) as any[];

      // Push in controlled micro-batches of 50 max
      const CHUNK_SIZE = 50;
      for (let i = 0; i < validJobs.length; i += CHUNK_SIZE) {
        const chunk = validJobs.slice(i, i + CHUNK_SIZE);
        await signalQueue.addBulk(chunk);
      }

      return reply.status(202).send({
        status: 'accepted',
        message: `${validJobs.length}/${signals.length} signals queued`,
        timestamp: new Date().toISOString(),
      });
    }
  );
}
