const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Typed fetch wrapper for all backend API calls.
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json();
}

/* ─── Types ─── */
export interface WorkItem {
  id: string;
  componentId: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  createdAt: string;
  updatedAt: string;
  rca?: RCA | null;
  _count?: { signals: number };
  rawSignals?: RawSignal[];
  signals?: { id: string; mongoSignalId: string; createdAt: string }[];
}

export interface RCA {
  id: string;
  workItemId: string;
  startTime: string;
  endTime: string;
  rootCauseCategory: string;
  fixApplied: string;
  preventionSteps: string;
  mttr: number;
  createdAt: string;
}

export interface RawSignal {
  _id: string;
  componentId: string;
  componentType: string;
  errorCode: string;
  latencyMs: number;
  payload: Record<string, unknown>;
  receivedAt: string;
  workItemId?: string;
}

export interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  avgMttr: number;
  totalRCAs: number;
  resolvedToday: number;
  signalsPerSec: number;
  p0Active: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SignalPayload {
  componentId: string;
  componentType: 'API' | 'RDBMS' | 'CACHE' | 'QUEUE' | 'NOSQL' | 'MCP';
  errorCode: string;
  latencyMs: number;
  payload?: Record<string, unknown>;
}

/* ─── API Functions ─── */

export async function fetchWorkItems(params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}): Promise<PaginatedResponse<WorkItem>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.priority) searchParams.set('priority', params.priority);

  const query = searchParams.toString();
  return request<PaginatedResponse<WorkItem>>(`/api/workitems${query ? `?${query}` : ''}`);
}

export async function fetchWorkItem(id: string): Promise<WorkItem> {
  return request<WorkItem>(`/api/workitems/${id}`);
}

export async function transitionStatus(id: string, status: string): Promise<{ status: string; data: WorkItem }> {
  return request(`/api/workitems/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function submitRCA(
  id: string,
  rca: {
    startTime: string;
    endTime: string;
    rootCauseCategory: string;
    fixApplied: string;
    preventionSteps: string;
  }
): Promise<{ status: string; data: RCA }> {
  return request(`/api/workitems/${id}/rca`, {
    method: 'POST',
    body: JSON.stringify(rca),
  });
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>('/api/dashboard/stats');
}

export async function sendSignal(signal: SignalPayload): Promise<void> {
  await request('/api/signals', {
    method: 'POST',
    body: JSON.stringify(signal),
  });
}

export async function fetchHealth(): Promise<any> {
  return request('/health');
}
