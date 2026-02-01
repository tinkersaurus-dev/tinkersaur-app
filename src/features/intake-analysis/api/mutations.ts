import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { outcomeApi, type CreateOutcomeDto } from '@/entities/outcome';
import { feedbackApi, type CreateFeedbackDto } from '@/entities/feedback';

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

/**
 * Mutation hook for deleting a feedback
 */
export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedbackId: string) => feedbackApi.delete(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks.all });
      toast.success('Feedback deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete feedback');
    },
  });
}

/**
 * Mutation hook for updating a feedback
 */
export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateFeedbackDto> }) =>
      feedbackApi.update(id, updates),
    onSuccess: (updatedFeedback, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks.all });
      if (updatedFeedback) {
        queryClient.setQueryData(queryKeys.feedbacks.detail(variables.id), updatedFeedback);
      }
      toast.success('Feedback updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update feedback');
    },
  });
}
