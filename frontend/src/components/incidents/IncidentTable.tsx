import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { WorkItem } from '../../lib/api';
import { formatDate, formatMTTR, shortId, pulseDotClass } from '../../lib/utils';

interface IncidentTableProps {
  workItems: WorkItem[];
  isLoading: boolean;
}

export function IncidentTable({ workItems, isLoading }: IncidentTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h3 className="data-table-title">Live Incidents</h3>
        </div>
        <div style={{ padding: '16px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton skeleton-line"
              style={{ height: '44px', marginBottom: '8px' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper">
      <div className="data-table-header">
        <h3 className="data-table-title">Live Incidents</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          {workItems.length} incidents · auto-refresh 3s
        </span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Component</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
            <th>MTTR</th>
            <th>Signals</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {workItems.map((item, idx) => (
              <motion.tr
                key={item.id}
                onClick={() => navigate(`/incidents/${item.id}`)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.02, duration: 0.2 }}
                layout
              >
                <td>
                  <span className="mono-id">{shortId(item.id)}</span>
                </td>
                <td>
                  <span style={{ fontWeight: 500 }}>{item.componentId}</span>
                </td>
                <td>
                  <span className={`badge badge-${item.priority.toLowerCase()}`}>
                    {item.priority}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${item.status.toLowerCase()}`}>
                    <span className={pulseDotClass(item.status)} />
                    {item.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {formatDate(item.createdAt)}
                </td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                  {item.rca ? formatMTTR(item.rca.mttr) : '—'}
                </td>
                <td style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                  {item._count?.signals ?? 0}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>

      {workItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No incidents yet</div>
          <div className="empty-state-desc">
            Run the simulation script to generate sample incidents
          </div>
        </div>
      )}
    </div>
  );
}
