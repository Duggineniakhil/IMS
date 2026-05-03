import { useQuery } from '@tanstack/react-query';
import { fetchWorkItems, type PaginatedResponse, type WorkItem } from '../lib/api';

/**
 * Hook for fetching paginated work items with auto-refresh every 3 seconds.
 */
export function useWorkItems(params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}) {
  return useQuery<PaginatedResponse<WorkItem>>({
    queryKey: ['workitems', params],
    queryFn: () => fetchWorkItems(params),
    refetchInterval: 3000,
    staleTime: 1000,
  });
}
