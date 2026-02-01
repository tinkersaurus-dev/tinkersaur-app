import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { useCaseApi } from '@/entities/use-case';
import type { MergeUseCasesRequest } from '@/entities/use-case';

/**
 * Mutation hook for merging use cases
 */
export function useMergeUseCases() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MergeUseCasesRequest) => useCaseApi.merge(request),
    onSuccess: () => {
      // Invalidate all use case queries since source use cases are now merged
      queryClient.invalidateQueries({ queryKey: queryKeys.useCases.all });
      // Invalidate personas and feedbacks since they have useCaseIds
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks.all });
      // Invalidate requirements (they've been transferred)
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all });
      toast.success('Use cases merged successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to merge use cases');
    },
  });
}
