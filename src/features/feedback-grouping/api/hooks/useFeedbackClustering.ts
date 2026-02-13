import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query';
import { feedbackClusteringApi } from '../feedbackClusteringApi';
import type { ApplyClustersRequest } from '../../model/types';

export function useGenerateClusters() {
  return useMutation({
    mutationFn: (params: {
      teamId: string;
      solutionId?: string;
      similarityThreshold?: number;
      minClusterSize?: number;
    }) => feedbackClusteringApi.generateClusters(params),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate clusters');
    },
  });
}

export function useApplyClusters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ApplyClustersRequest) => feedbackClusteringApi.applyClusters(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks.all });
      toast.success(
        `Applied ${data.totalClustersApplied} clusters, merged ${data.totalItemsMerged} items`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to apply clusters');
    },
  });
}
