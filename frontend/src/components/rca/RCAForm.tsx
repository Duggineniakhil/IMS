import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSubmitRCA } from '../../hooks/useRCA';
import type { WorkItem } from '../../lib/api';
import { formatMTTR } from '../../lib/utils';

interface RCAFormProps {
  workItem: WorkItem;
  onSuccess: () => void;
}

const ROOT_CAUSE_OPTIONS = [
  'Infrastructure',
  'Configuration',
  'Code Bug',
  'Third-party',
  'Human Error',
  'Unknown',
];

export function RCAForm({ workItem, onSuccess }: RCAFormProps) {
  const submitRCA = useSubmitRCA();

  const [form, setForm] = useState({
    startTime: '',
    endTime: '',
    rootCauseCategory: '',
    fixApplied: '',
    preventionSteps: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Live MTTR preview
  const mttrPreview = useMemo(() => {
    if (!form.endTime) return null;
    const endTime = new Date(form.endTime);
    const createdAt = new Date(workItem.createdAt);
    const mttrSeconds = Math.round((endTime.getTime() - createdAt.getTime()) / 1000);
    if (mttrSeconds <= 0) return 'Invalid (end time before creation)';
    return formatMTTR(mttrSeconds);
  }, [form.endTime, workItem.createdAt]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.startTime) newErrors.startTime = 'Required';
    if (!form.endTime) newErrors.endTime = 'Required';
    if (!form.rootCauseCategory) newErrors.rootCauseCategory = 'Required';
    if (form.fixApplied.length < 50) {
      newErrors.fixApplied = `Min 50 characters (${form.fixApplied.length}/50)`;
    }
    if (form.preventionSteps.length < 50) {
      newErrors.preventionSteps = `Min 50 characters (${form.preventionSteps.length}/50)`;
    }

    if (form.startTime && form.endTime) {
      const start = new Date(form.startTime);
      const end = new Date(form.endTime);
      if (end < start) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await submitRCA.mutateAsync({
        id: workItem.id,
        rca: {
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
          rootCauseCategory: form.rootCauseCategory,
          fixApplied: form.fixApplied,
          preventionSteps: form.preventionSteps,
        },
      });
      onSuccess();
    } catch (err) {
      setErrors({ submit: (err as Error).message });
    }
  };

  const isValid =
    form.startTime &&
    form.endTime &&
    form.rootCauseCategory &&
    form.fixApplied.length >= 50 &&
    form.preventionSteps.length >= 50;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="form-group">
        <label className="form-label">Start Time</label>
        <input
          type="datetime-local"
          className="form-input"
          value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
        />
        {errors.startTime && <div className="form-error">{errors.startTime}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">End Time</label>
        <input
          type="datetime-local"
          className="form-input"
          value={form.endTime}
          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
        />
        {errors.endTime && <div className="form-error">{errors.endTime}</div>}
      </div>

      {mttrPreview && (
        <div className="mttr-preview">
          ⏱️ MTTR: {mttrPreview}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Root Cause Category</label>
        <select
          className="form-select"
          value={form.rootCauseCategory}
          onChange={(e) => setForm({ ...form, rootCauseCategory: e.target.value })}
        >
          <option value="">Select category...</option>
          {ROOT_CAUSE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {errors.rootCauseCategory && (
          <div className="form-error">{errors.rootCauseCategory}</div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Fix Applied</label>
        <textarea
          className="form-textarea"
          placeholder="Describe the fix applied to resolve this incident..."
          value={form.fixApplied}
          onChange={(e) => setForm({ ...form, fixApplied: e.target.value })}
        />
        <div className="form-helper">
          {form.fixApplied.length}/50 characters minimum
        </div>
        {errors.fixApplied && <div className="form-error">{errors.fixApplied}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Prevention Steps</label>
        <textarea
          className="form-textarea"
          placeholder="Describe steps to prevent this incident from recurring..."
          value={form.preventionSteps}
          onChange={(e) => setForm({ ...form, preventionSteps: e.target.value })}
        />
        <div className="form-helper">
          {form.preventionSteps.length}/50 characters minimum
        </div>
        {errors.preventionSteps && (
          <div className="form-error">{errors.preventionSteps}</div>
        )}
      </div>

      {errors.submit && (
        <div
          className="form-error"
          style={{ marginBottom: '12px', padding: '8px', background: 'var(--p0-bg)', borderRadius: 'var(--radius-md)' }}
        >
          {errors.submit}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={!isValid || submitRCA.isPending}
        style={{ width: '100%' }}
      >
        {submitRCA.isPending ? (
          <>
            <span className="spinner" /> Submitting...
          </>
        ) : (
          '📋 Submit RCA'
        )}
      </button>
    </motion.form>
  );
}

interface RCASummaryProps {
  workItem: WorkItem;
}

export function RCASummary({ workItem }: RCASummaryProps) {
  const rca = workItem.rca;
  if (!rca) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        style={{
          padding: '16px',
          background: 'rgba(34, 197, 94, 0.06)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--p3)', marginBottom: '4px' }}>
          ✅ RCA Submitted
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          MTTR: {formatMTTR(rca.mttr)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <div className="form-label">Root Cause</div>
          <div style={{ fontSize: '14px' }}>{rca.rootCauseCategory}</div>
        </div>
        <div>
          <div className="form-label">Fix Applied</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {rca.fixApplied}
          </div>
        </div>
        <div>
          <div className="form-label">Prevention Steps</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {rca.preventionSteps}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <div className="form-label">Start Time</div>
            <div style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
              {new Date(rca.startTime).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="form-label">End Time</div>
            <div style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
              {new Date(rca.endTime).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
