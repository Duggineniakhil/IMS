import { PrismaClient, Status, Priority } from '@prisma/client';
import mongoose from 'mongoose';
import { RawSignalModel } from '../backend/src/models/RawSignal';

const prisma = new PrismaClient();

const COMPONENT_TYPES = ['API', 'RDBMS', 'CACHE', 'QUEUE', 'NOSQL', 'MCP'] as const;
const ERROR_CODES: Record<string, string[]> = {
  API: ['TIMEOUT', 'HTTP_500', 'HTTP_503', 'RATE_LIMITED'],
  RDBMS: ['CONN_TIMEOUT', 'DEADLOCK', 'MAX_CONNECTIONS', 'SLOW_QUERY'],
  CACHE: ['EVICTION_STORM', 'CONN_REFUSED', 'OOM', 'TIMEOUT'],
  QUEUE: ['QUEUE_FULL', 'CONSUMER_LAG', 'DEAD_LETTER', 'TIMEOUT'],
  NOSQL: ['REPLICA_LAG', 'WRITE_CONFLICT', 'SHARD_DOWN', 'TIMEOUT'],
  MCP: ['HEALTH_CHECK_FAIL', 'CONFIG_DRIFT', 'CERT_EXPIRY', 'TIMEOUT'],
};

const ROOT_CAUSE_CATEGORIES = [
  'Infrastructure',
  'Configuration',
  'Code Bug',
  'Third-party',
  'Human Error',
  'Unknown',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Seed script — creates sample data for development and demo.
 * Creates 10 WorkItems, 3 RCAs, and 500 raw signals.
 */
async function seed() {
  console.log('🌱 [SEED] Starting database seed...\n');

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ims_signals');
  console.log('✅ [SEED] MongoDB connected');

  // Clean existing data
  await prisma.signal.deleteMany();
  await prisma.rCA.deleteMany();
  await prisma.workItem.deleteMany();
  await RawSignalModel.deleteMany();
  console.log('🧹 [SEED] Cleaned existing data\n');

  const statuses: Status[] = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];
  const priorities: Priority[] = ['P0', 'P1', 'P2', 'P3'];

  const workItems: { id: string; componentId: string; status: Status; priority: Priority; createdAt: Date }[] = [];

  // Create 10 WorkItems
  const components = [
    'RDBMS_PRIMARY', 'RDBMS_REPLICA', 'API_GATEWAY', 'API_AUTH_SERVICE',
    'CACHE_CLUSTER_01', 'CACHE_SESSION', 'QUEUE_EVENTS', 'QUEUE_NOTIFICATIONS',
    'NOSQL_AUDIT', 'MCP_CONTROLLER',
  ];

  for (let i = 0; i < 10; i++) {
    const componentId = components[i];
    const componentType = componentId.split('_')[0] as typeof COMPONENT_TYPES[number];
    const status = statuses[i % 4];
    const priority = priorities[i % 4];
    const createdAt = new Date(Date.now() - randomBetween(3600000, 86400000));

    const workItem = await prisma.workItem.create({
      data: {
        componentId,
        status,
        priority,
        createdAt,
      },
    });

    workItems.push({ ...workItem });
    console.log(`  📌 WorkItem #${i + 1}: ${workItem.id.slice(0, 8)}... | ${componentId} | ${status} | ${priority}`);
  }

  console.log('');

  // Create 3 RCAs for RESOLVED and CLOSED items
  const rcaCandidates = workItems.filter((w) => w.status === 'RESOLVED' || w.status === 'CLOSED');
  for (let i = 0; i < Math.min(3, rcaCandidates.length); i++) {
    const wi = rcaCandidates[i];
    const startTime = new Date(wi.createdAt.getTime() + randomBetween(60000, 300000));
    const endTime = new Date(startTime.getTime() + randomBetween(600000, 7200000));
    const mttr = Math.round((endTime.getTime() - wi.createdAt.getTime()) / 1000);

    await prisma.rCA.create({
      data: {
        workItemId: wi.id,
        startTime,
        endTime,
        rootCauseCategory: randomItem(ROOT_CAUSE_CATEGORIES),
        fixApplied: `Applied hotfix to ${wi.componentId}: restarted service, updated configuration, and verified health checks passing.`,
        preventionSteps: `Added monitoring alerts for ${wi.componentId}, implemented circuit breaker pattern, and updated runbook documentation.`,
        mttr,
      },
    });

    console.log(`  📋 RCA for ${wi.componentId}: MTTR ${Math.round(mttr / 60)}min`);
  }

  console.log('');

  // Create 500 raw signals spread across work items
  let signalCount = 0;
  for (const wi of workItems) {
    const componentType = wi.componentId.split('_')[0] as keyof typeof ERROR_CODES;
    const signalsForItem = randomBetween(30, 80);

    for (let j = 0; j < signalsForItem && signalCount < 500; j++) {
      const mongoDoc = await RawSignalModel.create({
        componentId: wi.componentId,
        componentType,
        errorCode: randomItem(ERROR_CODES[componentType] || ['UNKNOWN']),
        latencyMs: randomBetween(100, 5000),
        payload: {
          host: `${wi.componentId.toLowerCase()}.internal`,
          region: randomItem(['us-east-1', 'us-west-2', 'eu-west-1']),
          timestamp: new Date(Date.now() - randomBetween(0, 86400000)),
        },
        receivedAt: new Date(Date.now() - randomBetween(0, 86400000)),
        workItemId: wi.id,
      });

      await prisma.signal.create({
        data: {
          workItemId: wi.id,
          mongoSignalId: mongoDoc._id.toString(),
        },
      });

      signalCount++;
    }
  }

  console.log(`  📡 Created ${signalCount} raw signals\n`);

  // Print summary
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│          🌱 SEED SUMMARY                    │');
  console.log('├─────────────────────────────────────────────┤');
  console.log(`│  WorkItems:     ${workItems.length.toString().padStart(4)}                       │`);
  console.log(`│  RCAs:          ${Math.min(3, rcaCandidates.length).toString().padStart(4)}                       │`);
  console.log(`│  Raw Signals:   ${signalCount.toString().padStart(4)}                       │`);
  console.log('├─────────────────────────────────────────────┤');
  console.log('│  Status Distribution:                       │');
  for (const s of statuses) {
    const count = workItems.filter((w) => w.status === s).length;
    console.log(`│    ${s.padEnd(15)} ${count.toString().padStart(3)}                       │`);
  }
  console.log('└─────────────────────────────────────────────┘');

  await prisma.$disconnect();
  await mongoose.disconnect();
  console.log('\n✅ [SEED] Complete!');
}

seed().catch((err) => {
  console.error('❌ [SEED] Failed:', err);
  process.exit(1);
});
