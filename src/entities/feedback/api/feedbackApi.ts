import type {
  Feedback,
  FeedbackWithChildren,
  CreateFeedbackDto,
  FindSimilarFeedbackRequest,
  SimilarFeedbackResult,
  MergeFeedbackRequest,
  MergeFeedbackResponse,
} from '../model/types';
import type { FeedbackListParams } from '@/shared/api';
import {
  createPaginatedEntityApi,
  httpClient,
  deserializeDates,
  deserializeDatesArray,
  type PaginatedEntityApi,
} from '@/shared/api';

type FeedbackApiExtensions = {
  listByTeam(teamId: string, solutionId?: string): Promise<Feedback[]>;
  findSimilar(request: FindSimilarFeedbackRequest): Promise<SimilarFeedbackResult[]>;
  merge(request: MergeFeedbackRequest): Promise<MergeFeedbackResponse>;
  unmerge(feedbackId: string): Promise<Feedback>;
  getWithChildren(id: string): Promise<FeedbackWithChildren>;
};

/**
 * Feedback API Client
 * Uses createPaginatedEntityApi factory with similarity, merge, and tree extensions
 */
export const feedbackApi = createPaginatedEntityApi<
  Feedback,
  CreateFeedbackDto,
  FeedbackListParams,
  FeedbackApiExtensions
>({
  endpoint: '/api/feedbacks',
  parentParam: 'teamId',
  extensions: (baseApi) => {
    const typedApi = baseApi as PaginatedEntityApi<Feedback, CreateFeedbackDto, FeedbackListParams>;

    return {
      async listByTeam(teamId: string, solutionId?: string): Promise<Feedback[]> {
        if (!solutionId) return typedApi.list(teamId);
        const data = await httpClient.get<Feedback[]>(
          `/api/feedbacks?teamId=${teamId}&solutionId=${solutionId}`
        );
        return deserializeDatesArray(data);
      },

      async findSimilar(request: FindSimilarFeedbackRequest): Promise<SimilarFeedbackResult[]> {
        const data = await httpClient.post<SimilarFeedbackResult[]>(
          '/api/feedbacks/similar',
          request
        );
        return data.map((result) => ({
          ...result,
          feedback: deserializeDates(result.feedback),
        }));
      },

      async merge(request: MergeFeedbackRequest): Promise<MergeFeedbackResponse> {
        const result = await httpClient.post<MergeFeedbackResponse>(
          '/api/feedbacks/merge',
          request
        );
        return {
          ...result,
          parent: deserializeDates(result.parent),
        };
      },

      async unmerge(feedbackId: string): Promise<Feedback> {
        const result = await httpClient.post<Feedback>(
          `/api/feedbacks/${feedbackId}/unmerge`,
          {}
        );
        return deserializeDates(result);
      },

      async getWithChildren(id: string): Promise<FeedbackWithChildren> {
        const data = await httpClient.get<FeedbackWithChildren>(
          `/api/feedbacks/${id}/with-children`
        );
        return {
          ...deserializeDates(data),
          children: deserializeDatesArray(data.children),
        };
      },
    };
  },
});
