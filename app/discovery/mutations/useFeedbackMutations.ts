import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '~/core/query/queryKeys';
import { feedbackApi } from '~/core/entities/discovery/api';
import type { MergeFeedbackRequest, CreateFeedbackDto } from '~/core/entities/discovery/types';

/**
 * Mutation hook for merging feedbacks (parent-child relationship)
 */
export function useMergeFeedbacks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MergeFeedbackRequest) => feedbackApi.merge(request),
    onSuccess: (data) => {
      // Invalidate feedback queries to refresh list
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks.all });
      toast.success(`Merged ${data.mergedCount} feedback items`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to merge feedback');
    },
  });
}

/**
 * Mutation hook for unmerging a feedback (detach from parent)
 */
export function useUnmergeFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedbackId: string) => feedbackApi.unmerge(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks.all });
      toast.success('Feedback detached successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to detach feedback');
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
