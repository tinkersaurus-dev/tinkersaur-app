import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { feedbackApi } from './feedbackApi';
import type { CreateFeedbackDto } from '../model/types';

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
