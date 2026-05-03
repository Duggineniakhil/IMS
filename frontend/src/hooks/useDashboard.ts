import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDashboardStats, type DashboardStats } from '../lib/api';

/**
 * Hook for fetching dashboard statistics with real-time SSE updates.
 */
export function useDashboard() {
  const queryClient = useQueryClient();
  const queryKey = ['dashboard-stats'];

  useEffect(() => {
    // Connect to SSE stream
    const eventSource = new EventSource('http://localhost:3001/api/dashboard/stream');

    eventSource.onmessage = (event) => {
      try {
        const stats = JSON.parse(event.data);
        if (stats.total !== undefined) {
          queryClient.setQueryData(queryKey, stats);
        }
      } catch (e) {
        console.error('Failed to parse SSE data', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  return useQuery<DashboardStats>({
    queryKey,
    queryFn: fetchDashboardStats,
    staleTime: Infinity, // Rely on SSE for updates
  });
}
