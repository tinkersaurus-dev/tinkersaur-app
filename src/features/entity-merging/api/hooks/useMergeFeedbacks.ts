import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { feedbackApi, type MergeFeedbackRequest } from '@/entities/feedback';

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
