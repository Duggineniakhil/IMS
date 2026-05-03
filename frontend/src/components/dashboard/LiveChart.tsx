import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardStats } from '../../lib/api';

interface LiveChartProps {
  stats: DashboardStats | undefined;
}

/**
 * Live area chart showing signals/sec over time.
 * Maintains a rolling 60-second window of data points.
 */
let chartHistory: { time: string; signals: number }[] = [];

export function LiveChart({ stats }: LiveChartProps) {
  const data = useMemo(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      minute: '2-digit',
      second: '2-digit',
    });

    chartHistory.push({
      time: timeStr,
      signals: stats?.signalsPerSec ?? 0,
    });

    // Keep last 20 data points
    if (chartHistory.length > 20) {
      chartHistory = chartHistory.slice(-20);
    }

    return [...chartHistory];
  }, [stats?.signalsPerSec]);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Signal Throughput</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          {stats?.signalsPerSec ?? 0} sig/s
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="signalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-primary)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
            axisLine={{ stroke: 'var(--border-primary)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
          />
          <Area
            type="monotone"
            dataKey="signals"
            stroke="var(--brand)"
            strokeWidth={3}
            fill="url(#signalGradient)"
            animationDuration={300}
            isAnimationActive={false} // Disable default animation for smoother real-time feel
            dot={(props: any) => {
              const { cx, cy, payload, index } = props;
              if (index === data.length - 1) {
                return (
                  <g key="latest-dot">
                    <circle cx={cx} cy={cy} r={6} fill="var(--brand)" opacity={0.3}>
                      <animate attributeName="r" values="6;12;6" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={cx} cy={cy} r={4} fill="var(--brand)" stroke="white" strokeWidth={2} />
                  </g>
                );
              }
              return null as any;
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
