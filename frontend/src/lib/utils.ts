/**
 * Formats MTTR from seconds into a human-readable string.
 * Examples: "2h 34m", "45m", "12s"
 */
export function formatMTTR(seconds: number): string {
  if (seconds <= 0) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

/**
 * Returns CSS class for a priority level.
 */
export function priorityClass(priority: string): string {
  return `badge-${priority.toLowerCase()}`;
}

/**
 * Returns CSS class for a status.
 */
export function statusClass(status: string): string {
  return `badge-${status.toLowerCase()}`;
}

/**
 * Returns pulse dot CSS class for a status.
 */
export function pulseDotClass(status: string): string {
  const base = `pulse-dot pulse-dot-${status.toLowerCase()}`;
  if (status === 'OPEN' || status === 'INVESTIGATING') {
    return `${base} active`;
  }
  return base;
}

/**
 * Formats a date string into a relative time or short date.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Shortens a UUID for display.
 */
export function shortId(id: string): string {
  return id.slice(0, 8);
}

/**
 * Returns a color for a component type.
 */
export function componentColor(componentId: string): string {
  if (componentId.startsWith('RDBMS')) return 'var(--p0)';
  if (componentId.startsWith('API')) return 'var(--p1)';
  if (componentId.startsWith('CACHE')) return 'var(--p2)';
  if (componentId.startsWith('QUEUE')) return 'var(--p1)';
  if (componentId.startsWith('NOSQL')) return 'var(--p2)';
  return 'var(--p3)';
}
