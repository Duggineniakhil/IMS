import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Singleton Redis client for caching and pub/sub.
 * Used for dashboard hot-path data and debounce keys.
 */
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ [CACHE] Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ [CACHE] Redis error:', err.message);
});

/**
 * Creates a new Redis connection (for BullMQ which needs separate connections).
 */
export function createRedisConnection(): Redis {
  return new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
