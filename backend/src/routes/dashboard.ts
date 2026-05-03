import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const CACHE_TTL = 5; // seconds

/**
 * Dashboard statistics API routes.
 * Provides aggregated metrics for the frontend dashboard.
 */
export async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/dashboard/stats
   * Returns aggregated statistics: total, byStatus, byPriority, avgMttr.
   * Results are cached in Redis for fast dashboard rendering.
   */
  fastify.get(
    '/api/dashboard/stats',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const cacheKey = 'dashboard:stats';

      // Try cache first
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return reply.send(JSON.parse(cached));
        }
      } catch (e) {
        // Cache miss
      }

      const [total, byStatus, byPriority, rcaStats, resolvedToday] = await Promise.all([
        prisma.workItem.count(),
        prisma.workItem.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        prisma.workItem.groupBy({
          by: ['priority'],
          _count: { priority: true },
        }),
        prisma.rCA.aggregate({
          _avg: { mttr: true },
          _count: true,
        }),
        prisma.workItem.count({
          where: {
            status: 'RESOLVED',
            updatedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

      // Get throughput from Redis
      let signalsPerSec = 0;
      try {
        signalsPerSec = parseInt((await redis.get('throughput:signals')) || '0', 10);
      } catch (e) {}

      const statusMap: Record<string, number> = {};
      byStatus.forEach((s) => {
        statusMap[s.status] = s._count.status;
      });

      const priorityMap: Record<string, number> = {};
      byPriority.forEach((p) => {
        priorityMap[p.priority] = p._count.priority;
      });

      const stats = {
        total,
        byStatus: statusMap,
        byPriority: priorityMap,
        avgMttr: Math.round(rcaStats._avg.mttr || 0),
        totalRCAs: rcaStats._count,
        resolvedToday,
        signalsPerSec,
        p0Active: statusMap['OPEN'] || 0,
      };

      // Cache result
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(stats));
      } catch (e) {}

      return reply.send(stats);
    }
  );
}
