import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { signalQueue } from '../queues/signalQueue';
import { SignalPayloadSchema, SignalPayload } from '../schemas/validation';
import { ZodError } from 'zod';

/**
 * Signal ingestion API routes.
 * POST /api/signals — Accepts signal payloads and enqueues for async processing.
 */
export async function signalRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/signals
   * Ingests a signal payload, validates it, and enqueues it for processing.
   * Returns 202 Accepted immediately — never awaits DB inside the request handler.
   */
  fastify.post(
    '/api/signals',
    async (
      request: FastifyRequest<{ Body: SignalPayload }>,
      reply: FastifyReply
    ) => {
      try {
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
      const signals = request.body;

      if (!Array.isArray(signals)) {
        return reply.status(400).send({
          status: 'error',
          message: 'Body must be an array of signals',
        });
      }

      const jobs = signals.map((signal, idx) => {
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
      }).filter(Boolean);

      if (jobs.length > 0) {
        await signalQueue.addBulk(jobs as any);
      }

      return reply.status(202).send({
        status: 'accepted',
        message: `${jobs.length}/${signals.length} signals queued`,
        timestamp: new Date().toISOString(),
      });
    }
  );
}
