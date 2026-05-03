/**
 * RDBMS Cascade Failure Simulation Script
 *
 * Simulates a realistic cascading failure scenario:
 * Phase 1 (t=0):   RDBMS starts throwing errors (150 signals over 8s)
 * Phase 2 (t=10s): Cache fails due to RDBMS overload (80 signals over 5s)
 * Phase 3 (t=20s): API layer times out (200 signals over 12s)
 * Phase 4 (t=35s): Summary of created WorkItems
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

interface SignalPayload {
  componentId: string;
  signalId: string;
  componentType: string;
  errorCode: string;
  latencyMs: number;
  payload: Record<string, unknown>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendSignal(signal: SignalPayload): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/signals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signal),
    });
    if (res.status !== 202) {
      console.warn(`  ⚠️  Signal rejected: ${res.status}`);
    }
  } catch (err) {
    console.error(`  ❌ Failed to send signal: ${(err as Error).message}`);
  }
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Phase 1: RDBMS Cascade ─────────────────────────────────────────────

async function phase1_rdbmsFailure(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🔴 PHASE 1: RDBMS PRIMARY — Connection Storm              ║');
  console.log('║  150 signals over 8 seconds → Triggers P0 WorkItem         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const errorCodes = ['CONN_TIMEOUT', 'DEADLOCK', 'MAX_CONNECTIONS', 'SLOW_QUERY'];

  for (let i = 0; i < 150; i++) {
    const signal: SignalPayload = {
      componentId: 'RDBMS_PRIMARY',
      signalId: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      componentType: 'RDBMS',
      errorCode: randomItem(errorCodes),
      latencyMs: 3500 + Math.random() * 2000,
      payload: {
        host: 'postgres-primary.internal',
        port: 5432,
        database: 'production',
        query: randomItem([
          'SELECT * FROM orders WHERE status = $1',
          'UPDATE inventory SET quantity = quantity - $1 WHERE id = $2',
          'INSERT INTO audit_log (event, data) VALUES ($1, $2)',
          'SELECT u.*, o.* FROM users u JOIN orders o ON u.id = o.user_id',
        ]),
        connectionPool: {
          active: randomBetween(90, 100),
          idle: randomBetween(0, 5),
          max: 100,
          waitingClients: randomBetween(10, 50),
        },
        errorDetails: {
          errno: randomItem(['-ECONNREFUSED', '-ETIMEDOUT', '-EPIPE']),
          syscall: 'connect',
        },
      },
    };

    await sendSignal(signal);
    process.stdout.write(`  📡 Sent RDBMS signal ${i + 1}/150\r`);
    await sleep(Math.round(8000 / 150));
  }

  console.log('\n  ✅ Phase 1 complete — 150 RDBMS signals sent\n');
}

// ─── Phase 2: Cache Failure ─────────────────────────────────────────────

async function phase2_cacheFailure(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🟡 PHASE 2: CACHE CLUSTER — Eviction Storm                ║');
  console.log('║  80 signals over 5 seconds → Triggers P2 WorkItem          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const errorCodes = ['EVICTION_STORM', 'CONN_REFUSED', 'OOM', 'TIMEOUT'];

  for (let i = 0; i < 80; i++) {
    const signal: SignalPayload = {
      componentId: 'CACHE_CLUSTER_01',
      signalId: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      componentType: 'CACHE',
      errorCode: randomItem(errorCodes),
      latencyMs: 500 + Math.random() * 1500,
      payload: {
        host: 'redis-cluster-01.internal',
        port: 6379,
        memoryUsagePercent: randomBetween(85, 99),
        evictedKeys: randomBetween(1000, 50000),
        hitRate: (Math.random() * 0.3).toFixed(4),
        connectedClients: randomBetween(200, 500),
        cause: 'RDBMS overload causing cache stampede',
      },
    };

    await sendSignal(signal);
    process.stdout.write(`  📡 Sent CACHE signal ${i + 1}/80\r`);
    await sleep(Math.round(5000 / 80));
  }

  console.log('\n  ✅ Phase 2 complete — 80 CACHE signals sent\n');
}

// ─── Phase 3: API Timeout ───────────────────────────────────────────────

async function phase3_apiTimeout(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🟠 PHASE 3: API GATEWAY — Cascading Timeouts              ║');
  console.log('║  200 signals over 12 seconds → Triggers P1 WorkItem        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const errorCodes = ['TIMEOUT', 'HTTP_500', 'HTTP_503', 'RATE_LIMITED'];

  for (let i = 0; i < 200; i++) {
    const signal: SignalPayload = {
      componentId: 'API_GATEWAY',
      signalId: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      componentType: 'API',
      errorCode: randomItem(errorCodes),
      latencyMs: 5000 + Math.random() * 10000,
      payload: {
        host: 'api-gateway.internal',
        port: 443,
        endpoint: randomItem([
          'GET /api/v1/orders',
          'POST /api/v1/checkout',
          'GET /api/v1/users/me',
          'POST /api/v1/payments',
          'GET /api/v1/inventory',
        ]),
        statusCode: randomItem([500, 502, 503, 504]),
        requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        upstreamLatencyMs: randomBetween(8000, 30000),
        retryCount: randomBetween(0, 3),
        cause: 'Upstream RDBMS and CACHE failures causing cascading timeouts',
      },
    };

    await sendSignal(signal);
    process.stdout.write(`  📡 Sent API signal ${i + 1}/200\r`);
    await sleep(Math.round(12000 / 200));
  }

  console.log('\n  ✅ Phase 3 complete — 200 API signals sent\n');
}

// ─── Phase 4: Summary ──────────────────────────────────────────────────

async function phase4_summary(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  📊 PHASE 4: Simulation Summary                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    const res = await fetch(`${API_URL}/api/workitems?limit=10`);
    const data = await res.json();

    console.log('  Created WorkItems:');
    console.log('  ┌────────────────────┬──────────────────┬──────────┬────────┐');
    console.log('  │ ID                 │ Component        │ Priority │ Status │');
    console.log('  ├────────────────────┼──────────────────┼──────────┼────────┤');

    for (const item of (data as any).data || []) {
      const id = item.id.slice(0, 18);
      const comp = item.componentId.padEnd(16);
      const pri = item.priority.padEnd(8);
      const stat = item.status;
      console.log(`  │ ${id} │ ${comp} │ ${pri} │ ${stat.padEnd(6)} │`);
    }

    console.log('  └────────────────────┴──────────────────┴──────────┴────────┘');

    const statsRes = await fetch(`${API_URL}/api/dashboard/stats`);
    const stats = await statsRes.json() as any;

    console.log(`\n  Total Incidents:   ${stats.total}`);
    console.log(`  Signals/sec:       ${stats.signalsPerSec}`);
    console.log(`  Avg MTTR:          ${stats.avgMttr}s`);
  } catch (err) {
    console.error('  ⚠️  Could not fetch summary — is the backend running?');
  }
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          🔥 RDBMS CASCADE FAILURE SIMULATION 🔥            ║');
  console.log('║                                                            ║');
  console.log('║  This simulates a realistic cascading failure:             ║');
  console.log('║  RDBMS → Cache → API Gateway                              ║');
  console.log('║                                                            ║');
  console.log('║  Total: 430 signals over ~35 seconds                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  // Phase 1: RDBMS (t=0)
  await phase1_rdbmsFailure();

  // Wait before Phase 2
  console.log('  ⏳ Waiting 2s before cache failure...');
  await sleep(2000);

  // Phase 2: Cache (t=10s)
  await phase2_cacheFailure();

  // Wait before Phase 3
  console.log('  ⏳ Waiting 2s before API failure...');
  await sleep(2000);

  // Phase 3: API (t=20s)
  await phase3_apiTimeout();

  // Wait for processing
  console.log('  ⏳ Waiting 3s for signal processing...');
  await sleep(3000);

  // Phase 4: Summary
  await phase4_summary();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  ⏱️  Total simulation time: ${elapsed}s`);
  console.log('  🎬 Simulation complete!\n');
}

main().catch((err) => {
  console.error('❌ Simulation failed:', err);
  process.exit(1);
});
