import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '~/core/query/queryKeys';
import { solutionOverviewApi } from '~/core/entities/product-management/api';
import type { UpdateSolutionOverviewDto } from '~/core/entities/product-management/types';

/**
 * Mutation hook for updating a solution overview
 */
export function useUpdateSolutionOverview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateSolutionOverviewDto }) =>
      solutionOverviewApi.update(id, updates),
    onSuccess: (updatedOverview) => {
      if (updatedOverview) {
        // Update cache directly for immediate feedback
        queryClient.setQueryData(
          queryKeys.solutionOverviews.bySolution(updatedOverview.solutionId),
          updatedOverview
        );
      }
      toast.success('Overview updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update overview');
    },
  });
}
