import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client instance for PostgreSQL operations.
 * Source of truth for WorkItems, RCAs, and Signal references.
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Connects to PostgreSQL and verifies the connection.
 */
export async function connectPostgres(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ [DB] PostgreSQL connected');
  } catch (error) {
    console.error('❌ [DB] PostgreSQL connection failed:', error);
    throw error;
  }
}

/**
 * Disconnects from PostgreSQL gracefully.
 */
export async function disconnectPostgres(): Promise<void> {
  await prisma.$disconnect();
  console.log('🔌 [DB] PostgreSQL disconnected');
}
