import { redis } from '../config/redis';
import { getQueueDepth } from '../queues/signalQueue';

/**
 * Throughput logger that runs every 5 seconds.
 * Uses a Redis sliding window counter to track signals/sec.
 */
export function startThroughputLogger(): NodeJS.Timeout {
  let lastCount = 0;

  const interval = setInterval(async () => {
    try {
      const currentCount = parseInt((await redis.get('throughput:signals')) || '0', 10);
      const signalsPerSec = Math.round((currentCount - lastCount) / 5);
      lastCount = currentCount;

      const depth = await getQueueDepth();

      console.log(
        `[THROUGHPUT] Signals/sec: ${Math.max(0, signalsPerSec)} | Queue depth: ${depth} | Active workers: 20`
      );
    } catch (e) {
      // Non-critical monitoring
    }
  }, 5000);

  console.log('📊 [OBSERVABILITY] Throughput logger started (5s interval)');
  return interval;
}
