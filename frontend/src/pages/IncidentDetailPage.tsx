import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '../components/layout/Header';
import { useWorkItem } from '../hooks/useWorkItem';
import { useTransitionStatus } from '../hooks/useRCA';
import { RCAForm, RCASummary } from '../components/rca/RCAForm';
import {
  formatDate,
  formatMTTR,
  shortId,
  pulseDotClass,
} from '../lib/utils';
import { useState } from 'react';

const VALID_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['INVESTIGATING'],
  INVESTIGATING: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workItem, isLoading, error } = useWorkItem(id || '');
  const transitionMutation = useTransitionStatus();
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [rcaSubmitted, setRcaSubmitted] = useState(false);

  const showToast = (message: string, type: string = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTransition = async (newStatus: string) => {
    if (!id) return;
    try {
      await transitionMutation.mutateAsync({ id, status: newStatus });
      showToast(`Status updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Incident Detail" />
        <div className="page-container">
          <div className="skeleton skeleton-card" style={{ height: '300px' }} />
        </div>
      </>
    );
  }

  if (error || !workItem) {
    return (
      <>
        <Header title="Incident Detail" />
        <div className="page-container">
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <div className="empty-state-title">Incident not found</div>
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  const validNextStates = VALID_TRANSITIONS[workItem.status] || [];

  return (
    <>
      <Header
        title={`Incident ${shortId(workItem.id)}`}
        subtitle={workItem.componentId}
      />
      <div className="page-container">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/dashboard')}
          style={{ marginBottom: '16px' }}
        >
          ← Back to Dashboard
        </button>

        <div className="detail-layout">
          {/* Left Panel — Incident Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Info Card */}
            <motion.div
              className="detail-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="detail-panel-header">
                Incident Information
              </div>
              <div className="detail-panel-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div className="form-label">ID</div>
                    <div className="mono-id" style={{ fontSize: '13px' }}>{workItem.id}</div>
                  </div>
                  <div>
                    <div className="form-label">Component</div>
                    <div style={{ fontWeight: 600 }}>{workItem.componentId}</div>
                  </div>
                  <div>
                    <div className="form-label">Priority</div>
                    <span className={`badge badge-${workItem.priority.toLowerCase()}`}>
                      {workItem.priority}
                    </span>
                  </div>
                  <div>
                    <div className="form-label">Status</div>
                    <span className={`badge badge-${workItem.status.toLowerCase()}`}>
                      <span className={pulseDotClass(workItem.status)} />
                      {workItem.status}
                    </span>
                  </div>
                  <div>
                    <div className="form-label">Created</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(workItem.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="form-label">MTTR</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                      {workItem.rca ? formatMTTR(workItem.rca.mttr) : '—'}
                    </div>
                  </div>
                </div>

                {/* Status Transition Buttons */}
                {validNextStates.length > 0 && (
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-primary)' }}>
                    <div className="form-label" style={{ marginBottom: '10px' }}>Actions</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {validNextStates.map((status) => (
                        <button
                          key={status}
                          className={`btn ${status === 'CLOSED' ? 'btn-danger' : 'btn-primary'} btn-sm`}
                          onClick={() => handleTransition(status)}
                          disabled={transitionMutation.isPending}
                        >
                          {transitionMutation.isPending ? (
                            <span className="spinner" />
                          ) : null}
                          Move to {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Signals List */}
            <motion.div
              className="detail-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="detail-panel-header">
                Raw Signals ({workItem.rawSignals?.length ?? workItem.signals?.length ?? 0})
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {(workItem.rawSignals && workItem.rawSignals.length > 0) ? (
                  workItem.rawSignals.map((signal, idx) => (
                    <div key={signal._id || idx} className="signal-item">
                      <span className="signal-code">{signal.errorCode}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>
                        {signal.componentType}
                      </span>
                      <span className="signal-latency">{Math.round(signal.latencyMs)}ms</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {formatDate(signal.receivedAt)}
                      </span>
                    </div>
                  ))
                ) : workItem.signals && workItem.signals.length > 0 ? (
                  workItem.signals.map((signal, idx) => (
                    <div key={signal.id || idx} className="signal-item">
                      <span className="signal-code mono-id">{shortId(signal.mongoSignalId)}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>
                        Signal Reference
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {formatDate(signal.createdAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '13px' }}>No signals recorded</div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Panel — RCA */}
          <motion.div
            className="detail-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <div className="detail-panel-header">
              Root Cause Analysis
            </div>
            <div className="detail-panel-body">
              {workItem.rca || rcaSubmitted ? (
                <RCASummary workItem={workItem} />
              ) : (
                <RCAForm
                  workItem={workItem}
                  onSuccess={() => {
                    setRcaSubmitted(true);
                    showToast('RCA submitted successfully!', 'success');
                  }}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <motion.div
            className={`toast toast-${toast.type}`}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast.type === 'success' ? '✅' : '❌'} {toast.message}
          </motion.div>
        </div>
      )}
    </>
  );
}
