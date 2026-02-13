import { httpClient, deserializeDatesArray } from '@/shared/api';
import type {
  GenerateClustersResponse,
  ApplyClustersRequest,
  ApplyClustersResponse,
} from '../model/types';

export const feedbackClusteringApi = {
  async generateClusters(params: {
    teamId: string;
    solutionId?: string;
    similarityThreshold?: number;
    minClusterSize?: number;
  }): Promise<GenerateClustersResponse> {
    const response = await httpClient.post<GenerateClustersResponse>(
      '/api/feedbacks/clusters/preview',
      params
    );

    // Deserialize dates in feedback items
    return {
      ...response,
      clusters: response.clusters.map((cluster) => ({
        ...cluster,
        items: deserializeDatesArray(cluster.items),
      })),
    };
  },

  async applyClusters(request: ApplyClustersRequest): Promise<ApplyClustersResponse> {
    return httpClient.post<ApplyClustersResponse>('/api/feedbacks/clusters/apply', request);
  },
};
