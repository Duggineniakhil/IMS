import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { IncidentTable } from '../components/incidents/IncidentTable';
import { useWorkItems } from '../hooks/useWorkItems';

const STATUS_OPTIONS = ['', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];
const PRIORITY_OPTIONS = ['', 'P0', 'P1', 'P2', 'P3'];

export function IncidentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useWorkItems({
    page,
    limit: 25,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });

  return (
    <>
      <Header title="Incidents" subtitle="All work items" />
      <div className="page-container">
        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <select
            className="form-select"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: '140px' }}
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.filter(Boolean).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {(statusFilter || priorityFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setStatusFilter('');
                setPriorityFilter('');
                setPage(1);
              }}
            >
              Clear filters
            </button>
          )}

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {data?.pagination.total ?? 0} total
          </span>
        </div>

        <IncidentTable
          workItems={data?.data ?? []}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Previous
            </button>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                padding: '0 12px',
              }}
            >
              Page {page} of {data.pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
