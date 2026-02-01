import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { personaApi } from '@/entities/persona';
import type { MergePersonasRequest } from '@/entities/persona';

/**
 * Mutation hook for merging personas
 */
export function useMergePersonas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MergePersonasRequest) => personaApi.merge(request),
    onSuccess: () => {
      // Invalidate all persona queries since source personas are now merged
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
      // Invalidate use cases and feedbacks since they have personaIds
      queryClient.invalidateQueries({ queryKey: queryKeys.useCases.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks.all });
      toast.success('Personas merged successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to merge personas');
    },
  });
}
