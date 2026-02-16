import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { outcomeApi } from './outcomeApi';
import type { CreateOutcomeDto } from '../model/types';

/**
 * Mutation hook for deleting an outcome
 */
export function useDeleteOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (outcomeId: string) => outcomeApi.delete(outcomeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outcomes.all });
      toast.success('Outcome deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete outcome');
    },
  });
}

/**
 * Mutation hook for updating an outcome
 */
export function useUpdateOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateOutcomeDto> }) =>
      outcomeApi.update(id, updates),
    onSuccess: (updatedOutcome, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outcomes.all });
      if (updatedOutcome) {
        queryClient.setQueryData(queryKeys.outcomes.detail(variables.id), updatedOutcome);
      }
      toast.success('Outcome updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update outcome');
    },
  });
}
