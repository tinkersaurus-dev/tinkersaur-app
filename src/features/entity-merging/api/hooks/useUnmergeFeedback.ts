import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { feedbackApi } from '@/entities/feedback';

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
