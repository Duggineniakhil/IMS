import { useQuery } from '@tanstack/react-query';
import { fetchWorkItem, type WorkItem } from '../lib/api';

/**
 * Hook for fetching a single work item with its linked signals.
 */
export function useWorkItem(id: string) {
  return useQuery<WorkItem>({
    queryKey: ['workitem', id],
    queryFn: () => fetchWorkItem(id),
    enabled: !!id,
    refetchInterval: 5000,
  });
}
