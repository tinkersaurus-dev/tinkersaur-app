import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { userGoalApi } from '@/entities/user-goal';
import type { MergeUserGoalsRequest } from '@/entities/user-goal';

/**
 * Mutation hook for merging user goals
 */
export function useMergeUserGoals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MergeUserGoalsRequest) => userGoalApi.merge(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userGoals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks.all });
      toast.success('User goals merged successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to merge user goals');
    },
  });
}
