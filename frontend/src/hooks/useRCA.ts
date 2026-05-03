import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitRCA, transitionStatus } from '../lib/api';

/**
 * Hook for submitting RCA with optimistic updates.
 */
export function useSubmitRCA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      rca,
    }: {
      id: string;
      rca: {
        startTime: string;
        endTime: string;
        rootCauseCategory: string;
        fixApplied: string;
        preventionSteps: string;
      };
    }) => submitRCA(id, rca),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workitem', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['workitems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

/**
 * Hook for transitioning work item status.
 */
export function useTransitionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      transitionStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workitem', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['workitems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
