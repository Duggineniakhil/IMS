import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { RawSignalModel } from '../models/RawSignal';
import { AlertStrategyFactory } from '../strategies/AlertStrategy';
import { withRetry } from '../utils/retry';
import { getQueueDepth, signalQueue } from '../queues/signalQueue';
import { SignalPayload } from '../schemas/validation';

const DEBOUNCE_TTL_SECONDS = 10;
const BACKPRESSURE_HIGH = 50000;
const BACKPRESSURE_LOW = 10000;

let isPaused = false;

/**
 * BullMQ Worker for processing incoming signals.
 *
 * Processing pipeline for each signal:
 * 1. Write raw payload to MongoDB (fire-and-forget with retry)
 * 2. Debounce check using Redis TTL key
 * 3. Create or link WorkItem in PostgreSQL
 * 4. Execute alert strategy for new WorkItems
 *
 * Concurrency: 20 parallel workers
 */
export function createSignalWorker(): Worker {
  const worker = new Worker(
    'signals',
    async (job: Job<SignalPayload>) => {
      const signal = job.data;

      // Step 1: Write raw payload to MongoDB with retry
      const mongoDoc = await withRetry(async () => {
        return await RawSignalModel.create({
          componentId: signal.componentId,
          signalId: signal.signalId,
          componentType: signal.componentType,
          errorCode: signal.errorCode,
          latencyMs: signal.latencyMs,
          payload: signal.payload || {},
          receivedAt: new Date(),
        });
      }, 3, 500);

      // Step 2: Debounce logic using Redis with 10-second time buckets
      const timeBucket = Math.floor(Date.now() / 10000); // 10s bucket
      const debounceKey = `debounce:${signal.componentId}:${timeBucket}`;
      const existingWorkItemId = await redis.get(debounceKey);

      if (existingWorkItemId) {
        // Link signal to existing WorkItem
        await withRetry(async () => {
          await prisma.signal.create({
            data: {
              workItemId: existingWorkItemId,
              mongoSignalId: mongoDoc._id.toString(),
            },
          });
        });

        // Update MongoDB document with workItemId
        await RawSignalModel.updateOne(
          { _id: mongoDoc._id },
          { workItemId: existingWorkItemId }
        );
      } else {
        // Create new WorkItem with transaction
        const strategy = AlertStrategyFactory.create(signal.componentType);
        const priority = strategy.getPriority();

        const workItem = await withRetry(async () => {
          return await prisma.$transaction(async (tx) => {
            const wi = await tx.workItem.create({
              data: {
                componentId: signal.componentId,
                priority,
                status: 'OPEN',
              },
            });

            await tx.signal.create({
              data: {
                workItemId: wi.id,
                mongoSignalId: mongoDoc._id.toString(),
              },
            });

            return wi;
          });
        });

        // Set debounce key in Redis
        await redis.setex(debounceKey, DEBOUNCE_TTL_SECONDS, workItem.id);

        // Update MongoDB document with workItemId
        await RawSignalModel.updateOne(
          { _id: mongoDoc._id },
          { workItemId: workItem.id }
        );

        // Execute alert strategy
        await strategy.execute({
          id: workItem.id,
          componentId: workItem.componentId,
          status: workItem.status,
        });

        // Invalidate dashboard cache and trigger real-time push
        try {
          const keys = await redis.keys('dashboard:*');
          if (keys.length > 0) await redis.del(...keys);
          await redis.del('workitems:list');
          await redis.publish('dashboard-updates', 'refresh');
        } catch (e) {
          // Cache invalidation is non-critical
        }
      }

      // Increment throughput counter
      const throughputKey = 'throughput:signals';
      await redis.incr(throughputKey);
      await redis.expire(throughputKey, 5);

      // Time-series aggregation sink (Signals per minute)
      const minuteBucket = new Date().toISOString().substring(0, 16); // e.g. "2026-05-03T12:00"
      const tsKey = `ts:signals:${minuteBucket}`;
      await redis.incr(tsKey);
      await redis.expire(tsKey, 60 * 60 * 24); // Keep for 24 hours
    },
    {
      connection: createRedisConnection(),
      concurrency: 20,
      limiter: {
        max: 1000,
        duration: 1000,
      },
    }
  );

  worker.on('completed', (_job) => {
    // Silently completed
  });

  worker.on('failed', (job, error) => {
    console.error(`❌ [WORKER] Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('❌ [WORKER] Worker error:', error.message);
  });

  // Backpressure monitoring
  setInterval(async () => {
    try {
      const depth = await getQueueDepth();

      if (depth > BACKPRESSURE_HIGH && !isPaused) {
        console.warn(`⚠️  [BACKPRESSURE] Queue depth ${depth} exceeds ${BACKPRESSURE_HIGH} — pausing ingestion`);
        await signalQueue.pause();
        isPaused = true;
      } else if (depth < BACKPRESSURE_LOW && isPaused) {
        console.log(`✅ [BACKPRESSURE] Queue depth ${depth} below ${BACKPRESSURE_LOW} — resuming ingestion`);
        await signalQueue.resume();
        isPaused = false;
      }
    } catch (e) {
      // Non-critical monitoring
    }
  }, 2000);

  console.log('🚀 [WORKER] Signal worker started with concurrency: 20');

  return worker;
}
