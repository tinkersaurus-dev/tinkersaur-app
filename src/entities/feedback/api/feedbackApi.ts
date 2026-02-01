import type {
  Feedback,
  FeedbackWithChildren,
  CreateFeedbackDto,
  FindSimilarFeedbackRequest,
  SimilarFeedbackResult,
  MergeFeedbackRequest,
  MergeFeedbackResponse,
} from '../model/types';
import type { PaginatedResponse, FeedbackListParams } from '@/shared/api';
import { httpClient, deserializeDates, deserializeDatesArray } from '@/shared/api';

export const feedbackApi = {
  async list(teamId: string): Promise<Feedback[]> {
    const url = `/api/feedbacks?teamId=${teamId}`;
    const data = await httpClient.get<Feedback[]>(url);
    return deserializeDatesArray(data);
  },

  listByTeam(teamId: string): Promise<Feedback[]> {
    return this.list(teamId);
  },

  async listPaginated(params: FeedbackListParams): Promise<PaginatedResponse<Feedback>> {
    const searchParams = new URLSearchParams();
    searchParams.set('teamId', params.teamId);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.solutionId) searchParams.set('solutionId', params.solutionId);
    if (params.personaIds?.length) {
      params.personaIds.forEach(id => searchParams.append('personaIds', id));
    }
    if (params.useCaseIds?.length) {
      params.useCaseIds.forEach(id => searchParams.append('useCaseIds', id));
    }
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const data = await httpClient.get<PaginatedResponse<Feedback>>(
      `/api/feedbacks?${searchParams.toString()}`
    );
    return {
      ...data,
      items: deserializeDatesArray(data.items),
    };
  },

  async get(id: string): Promise<Feedback> {
    const data = await httpClient.get<Feedback>(`/api/feedbacks/${id}`);
    return deserializeDates(data);
  },

  async create(data: CreateFeedbackDto): Promise<Feedback> {
    const result = await httpClient.post<Feedback>('/api/feedbacks', data);
    return deserializeDates(result);
  },

  async update(id: string, updates: Partial<CreateFeedbackDto>): Promise<Feedback> {
    const result = await httpClient.put<Feedback>(`/api/feedbacks/${id}`, updates);
    return deserializeDates(result);
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/api/feedbacks/${id}`);
  },

  async findSimilar(request: FindSimilarFeedbackRequest): Promise<SimilarFeedbackResult[]> {
    const data = await httpClient.post<SimilarFeedbackResult[]>('/api/feedbacks/similar', request);
    // Deserialize dates in nested feedback objects
    return data.map(result => ({
      ...result,
      feedback: deserializeDates(result.feedback),
    }));
  },

  async merge(request: MergeFeedbackRequest): Promise<MergeFeedbackResponse> {
    const result = await httpClient.post<MergeFeedbackResponse>('/api/feedbacks/merge', request);
    return {
      ...result,
      parent: deserializeDates(result.parent),
    };
  },

  async unmerge(feedbackId: string): Promise<Feedback> {
    const result = await httpClient.post<Feedback>(`/api/feedbacks/${feedbackId}/unmerge`, {});
    return deserializeDates(result);
  },

  async getWithChildren(id: string): Promise<FeedbackWithChildren> {
    const data = await httpClient.get<FeedbackWithChildren>(`/api/feedbacks/${id}/with-children`);
    return {
      ...deserializeDates(data),
      children: deserializeDatesArray(data.children),
    };
  },
};
