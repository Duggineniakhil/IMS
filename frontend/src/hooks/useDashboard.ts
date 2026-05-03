import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, type DashboardStats } from '../lib/api';

/**
 * Hook for fetching dashboard statistics with polling.
 */
export function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 3000,
    staleTime: 1000,
  });
}
