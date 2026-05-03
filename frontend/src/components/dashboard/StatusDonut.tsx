import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { DashboardStats } from '../../lib/api';

interface StatusDonutProps {
  stats: DashboardStats | undefined;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#6366F1',
  INVESTIGATING: '#F97316',
  RESOLVED: '#22C55E',
  CLOSED: '#64748B',
};

export function StatusDonut({ stats }: StatusDonutProps) {
  const data = Object.entries(stats?.byStatus ?? {}).map(([name, value]) => ({
    name,
    value,
  }));

  if (data.length === 0) {
    data.push({ name: 'No Data', value: 1 });
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">By Status</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            animationDuration={400}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.name] || '#64748B'}
                strokeWidth={0}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          marginTop: '-8px',
        }}
      >
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div
            key={status}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: color,
              }}
            />
            {status}
          </div>
        ))}
      </div>
    </div>
  );
}
