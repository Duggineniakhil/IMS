import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const CACHE_TTL = 5; // seconds

/**
 * Dashboard statistics API routes.
 * Provides aggregated metrics for the frontend dashboard.
 */
/**
 * Helper to fetch and format dashboard stats
 */
async function getDashboardStats() {
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

  return {
    total,
    byStatus: statusMap,
    byPriority: priorityMap,
    avgMttr: Math.round(rcaStats._avg.mttr || 0),
    totalRCAs: rcaStats._count,
    resolvedToday,
    signalsPerSec,
    p0Active: statusMap['OPEN'] || 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Dashboard statistics API routes.
 */
export async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/dashboard/stats
   * Uses Redis hot-path cache for fast reads.
   */
  fastify.get(
    '/api/dashboard/stats',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const cacheKey = 'dashboard:stats';
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return reply.send(JSON.parse(cached));
      } catch (e) {}

      const stats = await getDashboardStats();
      await redis.setex(cacheKey, 5, JSON.stringify(stats));
      return reply.send(stats);
    }
  );

  /**
   * GET /api/dashboard/stream
   * Server-Sent Events (SSE) for real-time dashboard updates.
   */
  fastify.get('/api/dashboard/stream', async (request, reply) => {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    };
    reply.raw.writeHead(200, headers);

    // Initial push
    const stats = await getDashboardStats();
    reply.raw.write(`data: ${JSON.stringify(stats)}\n\n`);

    // We use an internal subscriber for Redis events
    const sub = await redis.duplicate();
    await sub.subscribe('dashboard-updates');

    sub.on('message', async () => {
      const latestStats = await getDashboardStats();
      reply.raw.write(`data: ${JSON.stringify(latestStats)}\n\n`);
    });

    // Cleanup on disconnect
    request.raw.on('close', () => {
      sub.disconnect();
    });
  });
}
