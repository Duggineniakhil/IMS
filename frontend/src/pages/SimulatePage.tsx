import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '../components/layout/Header';
import { sendSignal, type SignalPayload } from '../lib/api';

interface SimScenario {
  title: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
  signals: SignalPayload[];
  count: number;
  delayMs: number;
}

const scenarios: SimScenario[] = [
  {
    title: 'RDBMS Connection Storm',
    icon: '🗄️',
    description: 'Simulates PostgreSQL running out of connections. Sends 50 P0 signals over 5 seconds.',
    color: 'var(--p0)',
    bgColor: 'var(--p0-bg)',
    count: 50,
    delayMs: 100,
    signals: [
      {
        componentId: 'RDBMS_PRIMARY',
        componentType: 'RDBMS',
        errorCode: 'MAX_CONNECTIONS',
        latencyMs: 5000,
        payload: { host: 'postgres-primary.internal', database: 'production', connectionPool: { active: 100, idle: 0, max: 100 } },
      },
    ],
  },
  {
    title: 'Cache Eviction Storm',
    icon: '⚡',
    description: 'Simulates Redis running out of memory. Sends 30 P2 signals over 3 seconds.',
    color: 'var(--p2)',
    bgColor: 'var(--p2-bg)',
    count: 30,
    delayMs: 100,
    signals: [
      {
        componentId: 'CACHE_CLUSTER_01',
        componentType: 'CACHE',
        errorCode: 'OOM',
        latencyMs: 1500,
        payload: { host: 'redis-cluster.internal', memoryUsagePercent: 99, evictedKeys: 50000 },
      },
    ],
  },
  {
    title: 'API Gateway Timeout',
    icon: '🌐',
    description: 'Simulates API gateway timing out under load. Sends 40 P1 signals over 4 seconds.',
    color: 'var(--p1)',
    bgColor: 'var(--p1-bg)',
    count: 40,
    delayMs: 100,
    signals: [
      {
        componentId: 'API_GATEWAY',
        componentType: 'API',
        errorCode: 'TIMEOUT',
        latencyMs: 12000,
        payload: { endpoint: 'GET /api/v1/orders', statusCode: 504, upstreamLatencyMs: 30000 },
      },
    ],
  },
  {
    title: 'Queue Consumer Lag',
    icon: '📨',
    description: 'Simulates message queue consumer falling behind. Sends 25 P1 signals over 2.5 seconds.',
    color: 'var(--p1)',
    bgColor: 'var(--p1-bg)',
    count: 25,
    delayMs: 100,
    signals: [
      {
        componentId: 'QUEUE_EVENTS',
        componentType: 'QUEUE',
        errorCode: 'CONSUMER_LAG',
        latencyMs: 8000,
        payload: { queueName: 'events', pendingMessages: 150000, consumerCount: 2 },
      },
    ],
  },
  {
    title: 'NoSQL Replica Lag',
    icon: '🍃',
    description: 'Simulates MongoDB replica falling behind. Sends 20 P2 signals over 2 seconds.',
    color: 'var(--p2)',
    bgColor: 'var(--p2-bg)',
    count: 20,
    delayMs: 100,
    signals: [
      {
        componentId: 'NOSQL_AUDIT',
        componentType: 'NOSQL',
        errorCode: 'REPLICA_LAG',
        latencyMs: 3000,
        payload: { replicaSet: 'rs0', lagSeconds: 45, host: 'mongo-secondary.internal' },
      },
    ],
  },
  {
    title: 'Full Cascade Failure',
    icon: '💥',
    description: 'Simulates RDBMS → Cache → API cascade. Sends 100 signals across 3 components over 10 seconds.',
    color: 'var(--p0)',
    bgColor: 'var(--p0-bg)',
    count: 100,
    delayMs: 100,
    signals: [
      {
        componentId: 'RDBMS_PRIMARY',
        componentType: 'RDBMS',
        errorCode: 'CONN_TIMEOUT',
        latencyMs: 5000,
        payload: { host: 'postgres-primary.internal', cascade: true },
      },
      {
        componentId: 'CACHE_CLUSTER_01',
        componentType: 'CACHE',
        errorCode: 'EVICTION_STORM',
        latencyMs: 2000,
        payload: { host: 'redis-cluster.internal', cascade: true },
      },
      {
        componentId: 'API_GATEWAY',
        componentType: 'API',
        errorCode: 'HTTP_503',
        latencyMs: 15000,
        payload: { endpoint: 'POST /api/v1/checkout', cascade: true },
      },
    ],
  },
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function SimulatePage() {
  const [running, setRunning] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const runScenario = async (scenario: SimScenario) => {
    if (running) return;
    setRunning(scenario.title);
    setProgress(0);

    try {
      for (let i = 0; i < scenario.count; i++) {
        const signal = scenario.signals[i % scenario.signals.length];
        const jitteredSignal: SignalPayload = {
          ...signal,
          latencyMs: signal.latencyMs + Math.random() * 2000,
          errorCode: signal.errorCode,
        };

        try {
          await sendSignal(jitteredSignal);
        } catch {
          // Continue on individual failures
        }

        setProgress(Math.round(((i + 1) / scenario.count) * 100));
        await sleep(scenario.delayMs);
      }
      showToast(`✅ ${scenario.title} — ${scenario.count} signals sent`, 'success');
    } catch (err) {
      showToast(`Failed: ${(err as Error).message}`, 'error');
    } finally {
      setRunning(null);
      setProgress(0);
    }
  };

  return (
    <>
      <Header title="Simulate" subtitle="Trigger failure scenarios for testing" />
      <div className="page-container">
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(99, 102, 241, 0.06)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            marginBottom: '24px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}
        >
          💡 <strong style={{ color: 'var(--brand)' }}>How it works:</strong> Each scenario sends
          signals to the backend API, which queues them via BullMQ for processing. The worker creates
          WorkItems, triggers alerts, and updates the dashboard in real-time. Watch the Dashboard
          while running a simulation!
        </div>

        <div className="simulate-grid">
          {scenarios.map((scenario, idx) => (
            <motion.div
              key={scenario.title}
              className="simulate-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              onClick={() => runScenario(scenario)}
              style={{
                opacity: running && running !== scenario.title ? 0.5 : 1,
                pointerEvents: running ? 'none' : 'auto',
              }}
            >
              <div
                className="sim-icon"
                style={{ background: scenario.bgColor, color: scenario.color }}
              >
                {scenario.icon}
              </div>
              <div className="sim-title">{scenario.title}</div>
              <div className="sim-desc">{scenario.description}</div>

              {running === scenario.title && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      height: '4px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      style={{
                        height: '100%',
                        background: scenario.color,
                        borderRadius: '2px',
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                      marginTop: '6px',
                      textAlign: 'center',
                    }}
                  >
                    {progress}% — Sending signals...
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {toast && (
        <div className="toast-container">
          <motion.div
            className={`toast toast-${toast.type}`}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
          >
            {toast.message}
          </motion.div>
        </div>
      )}
    </>
  );
}
