import CircuitBreaker from 'opossum';
import { prisma } from '../config/database';

/**
 * Circuit Breaker configuration for PostgreSQL operations.
 * Opens after 5 consecutive failures, resets after 30 seconds.
 */
const circuitBreakerOptions = {
  timeout: 10000,        // 10 second timeout for each operation
  errorThresholdPercentage: 50,
  resetTimeout: 30000,   // 30 seconds before attempting to close
  volumeThreshold: 5,    // Minimum 5 requests before tripping
};

/**
 * Creates a circuit breaker wrapper for any async function.
 * Used to protect PostgreSQL from cascade failures.
 */
export function createCircuitBreaker<T>(
  fn: (...args: any[]) => Promise<T>,
  name: string
): CircuitBreaker {
  const breaker = new CircuitBreaker(fn, {
    ...circuitBreakerOptions,
    name,
  });

  breaker.on('open', () => {
    console.error(`🔴 [CIRCUIT_OPEN] ${name}: Circuit breaker opened — stopping Postgres calls for 30s`);
  });

  breaker.on('halfOpen', () => {
    console.warn(`🟡 [CIRCUIT_HALF_OPEN] ${name}: Testing if Postgres is back...`);
  });

  breaker.on('close', () => {
    console.log(`🟢 [CIRCUIT_CLOSED] ${name}: Circuit breaker closed — Postgres is healthy`);
  });

  breaker.on('fallback', () => {
    console.warn(`⚡ [CIRCUIT_FALLBACK] ${name}: Using fallback due to open circuit`);
  });

  return breaker;
}

/**
 * Circuit-breaker-protected Prisma query helper.
 * Wraps any Prisma operation with circuit breaker protection.
 */
export const postgresBreaker = createCircuitBreaker(
  async (operation: () => Promise<any>) => {
    return await operation();
  },
  'PostgresBreaker'
);
