import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { connectPostgres, disconnectPostgres } from './config/database';
import { connectMongo, disconnectMongo } from './config/mongo';
import { redis } from './config/redis';
import { signalRoutes } from './routes/signals';
import { workItemRoutes } from './routes/workitems';
import { dashboardRoutes } from './routes/dashboard';
import { healthRoutes } from './routes/health';
import { createSignalWorker } from './workers/signalWorker';
import { startThroughputLogger } from './observability/throughput';

const PORT = parseInt(process.env.PORT || '3001', 10);

/**
 * Creates and configures the Fastify server instance.
 */
async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Register rate limiting
  await fastify.register(rateLimit, {
    max: 500,
    timeWindow: '1 second',
    keyGenerator: (request) => {
      return request.ip;
    },
  });

  // Register routes
  await fastify.register(signalRoutes);
  await fastify.register(workItemRoutes);
  await fastify.register(dashboardRoutes);
  await fastify.register(healthRoutes);

  return fastify;
}

/**
 * Main entry point — connects to all databases, starts the worker, and listens.
 */
async function main() {
  console.log('🏗️  [IMS] Starting Incident Management System...');

  // Connect to databases
  await connectPostgres();
  await connectMongo();

  // Verify Redis
  await redis.ping();
  console.log('✅ [CACHE] Redis ping successful');

  // Build and start server
  const fastify = await buildServer();

  // Start BullMQ worker
  const worker = createSignalWorker();

  // Start throughput logger
  const throughputInterval = startThroughputLogger();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 [IMS] Received ${signal}, shutting down gracefully...`);

    clearInterval(throughputInterval);
    await worker.close();
    await fastify.close();
    await disconnectPostgres();
    await disconnectMongo();
    await redis.quit();

    console.log('👋 [IMS] Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Start listening
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`\n🚀 [IMS] Server running at http://localhost:${PORT}`);
    console.log(`   📊 Health: http://localhost:${PORT}/health`);
    console.log(`   📡 API:    http://localhost:${PORT}/api/workitems\n`);
  } catch (err) {
    console.error('❌ [IMS] Failed to start server:', err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ [IMS] Fatal error:', err);
  process.exit(1);
});
