import type { Feedback, CreateFeedbackDto } from '../types';
import type { PaginatedResponse, FeedbackListParams } from '~/core/api/types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

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

    const data = await httpClient.get<PaginatedResponse<Feedback>>(
      `/api/feedbacks?${searchParams.toString()}`
    );
    return {
      ...data,
      items: deserializeDatesArray(data.items),
    };
  },

  async get(id: string): Promise<Feedback | null> {
    try {
      const data = await httpClient.get<Feedback>(`/api/feedbacks/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  },

  async create(data: CreateFeedbackDto): Promise<Feedback> {
    const result = await httpClient.post<Feedback>('/api/feedbacks', data);
    return deserializeDates(result);
  },

  async update(id: string, updates: Partial<CreateFeedbackDto>): Promise<Feedback | null> {
    try {
      const result = await httpClient.put<Feedback>(`/api/feedbacks/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/feedbacks/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
