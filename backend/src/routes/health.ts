import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { getQueueStats } from '../queues/signalQueue';
import mongoose from 'mongoose';

/**
 * Health check endpoint for monitoring and orchestration.
 */
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /health
   * Returns system health status including DB connections and queue depth.
   */
  fastify.get(
    '/health',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const startTime = process.hrtime.bigint();

      let pgConnected = false;
      let mongoConnected = false;
      let redisConnected = false;

      // Check PostgreSQL
      try {
        await prisma.$queryRaw`SELECT 1`;
        pgConnected = true;
      } catch (e) {}

      // Check MongoDB
      try {
        mongoConnected = mongoose.connection.readyState === 1;
      } catch (e) {}

      // Check Redis
      try {
        await redis.ping();
        redisConnected = true;
      } catch (e) {}

      // Queue stats
      let queueStats = { depth: 0, waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
      try {
        queueStats = await getQueueStats();
      } catch (e) {}

      const elapsed = Number(process.hrtime.bigint() - startTime) / 1e6;

      const allHealthy = pgConnected && mongoConnected && redisConnected;

      return reply.status(allHealthy ? 200 : 503).send({
        status: allHealthy ? 'ok' : 'degraded',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        responseTimeMs: Math.round(elapsed),
        services: {
          postgres: pgConnected ? 'connected' : 'disconnected',
          mongodb: mongoConnected ? 'connected' : 'disconnected',
          redis: redisConnected ? 'connected' : 'disconnected',
        },
        queue: queueStats,
      });
    }
  );
}
