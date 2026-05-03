import { motion } from 'framer-motion';
import type { DashboardStats } from '../../lib/api';
import { formatMTTR } from '../../lib/utils';

interface StatsBarProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export function StatsBar({ stats, isLoading }: StatsBarProps) {
  const cards = [
    {
      label: 'Total Incidents',
      value: stats?.total ?? 0,
      icon: '🔥',
      color: 'var(--brand)',
      bgColor: 'rgba(99, 102, 241, 0.1)',
    },
    {
      label: 'P0 Active',
      value: stats?.byPriority?.P0 ?? 0,
      icon: '🚨',
      color: 'var(--p0)',
      bgColor: 'var(--p0-bg)',
    },
    {
      label: 'Avg MTTR',
      value: formatMTTR(stats?.avgMttr ?? 0),
      icon: '⏱️',
      color: 'var(--p1)',
      bgColor: 'var(--p1-bg)',
    },
    {
      label: 'Resolved Today',
      value: stats?.resolvedToday ?? 0,
      icon: '✅',
      color: 'var(--p3)',
      bgColor: 'var(--p3-bg)',
    },
  ];

  if (isLoading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton skeleton-card" style={{ height: '110px' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid">
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.3 }}
        >
          <div
            className="stat-icon"
            style={{ background: card.bgColor, color: card.color }}
          >
            {card.icon}
          </div>
          <div className="stat-label">{card.label}</div>
          <div className="stat-value" style={{ color: card.color }}>
            {card.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
