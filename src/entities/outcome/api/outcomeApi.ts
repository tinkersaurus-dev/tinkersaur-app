import type { Outcome, CreateOutcomeDto, FindSimilarOutcomesRequest, SimilarOutcomeResult } from '../model/types';
import type { PaginatedResponse, OutcomeListParams } from '@/shared/api';
import { httpClient, deserializeDates, deserializeDatesArray } from '@/shared/api';

export const outcomeApi = {
  async list(teamId: string): Promise<Outcome[]> {
    const url = `/api/outcomes?teamId=${teamId}`;
    const data = await httpClient.get<Outcome[]>(url);
    return deserializeDatesArray(data);
  },

  listByTeam(teamId: string): Promise<Outcome[]> {
    return this.list(teamId);
  },

  async listPaginated(params: OutcomeListParams): Promise<PaginatedResponse<Outcome>> {
    const searchParams = new URLSearchParams();
    searchParams.set('teamId', params.teamId);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.solutionId) searchParams.set('solutionId', params.solutionId);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const data = await httpClient.get<PaginatedResponse<Outcome>>(
      `/api/outcomes?${searchParams.toString()}`
    );
    return {
      ...data,
      items: deserializeDatesArray(data.items),
    };
  },

  async get(id: string): Promise<Outcome> {
    const data = await httpClient.get<Outcome>(`/api/outcomes/${id}`);
    return deserializeDates(data);
  },

  async create(data: CreateOutcomeDto): Promise<Outcome> {
    const result = await httpClient.post<Outcome>('/api/outcomes', data);
    return deserializeDates(result);
  },

  async update(id: string, updates: Partial<CreateOutcomeDto>): Promise<Outcome> {
    const result = await httpClient.put<Outcome>(`/api/outcomes/${id}`, updates);
    return deserializeDates(result);
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/api/outcomes/${id}`);
  },

  async findSimilar(request: FindSimilarOutcomesRequest): Promise<SimilarOutcomeResult[]> {
    const data = await httpClient.post<SimilarOutcomeResult[]>('/api/outcomes/similar', request);
    // Deserialize dates in nested outcome objects
    return data.map(result => ({
      ...result,
      outcome: deserializeDates(result.outcome),
    }));
  },
};
