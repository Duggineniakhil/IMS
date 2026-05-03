import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';

/**
 * BullMQ queue for signal processing.
 * Acts as a buffer between HTTP ingestion and database writes,
 * preventing DB overload during signal bursts.
 */
export const signalQueue = new Queue('signals', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

/**
 * Returns the current depth of the signal queue.
 */
export async function getQueueDepth(): Promise<number> {
  const counts = await signalQueue.getJobCounts();
  return counts.waiting + counts.active + counts.delayed;
}

/**
 * Returns detailed queue statistics.
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  depth: number;
}> {
  const counts = await signalQueue.getJobCounts();
  return {
    waiting: counts.waiting || 0,
    active: counts.active || 0,
    completed: counts.completed || 0,
    failed: counts.failed || 0,
    delayed: counts.delayed || 0,
    depth: (counts.waiting || 0) + (counts.active || 0) + (counts.delayed || 0),
  };
}
