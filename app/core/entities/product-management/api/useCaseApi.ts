import type { UseCase, CreateUseCaseDto, FindSimilarUseCasesRequest, SimilarUseCaseResult, MergeUseCasesRequest } from '../types';
import type { PaginatedResponse, UseCaseListParams } from '~/core/api/types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

export const useCaseApi = {
  async listByTeam(teamId: string, unassignedOnly = false): Promise<UseCase[]> {
    const url = `/api/use-cases?teamId=${teamId}${unassignedOnly ? '&unassignedOnly=true' : ''}`;
    const data = await httpClient.get<UseCase[]>(url);
    return deserializeDatesArray(data);
  },

  async listPaginated(params: UseCaseListParams): Promise<PaginatedResponse<UseCase>> {
    const searchParams = new URLSearchParams();
    searchParams.set('teamId', params.teamId);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.solutionId) searchParams.set('solutionId', params.solutionId);
    if (params.personaIds?.length) {
      params.personaIds.forEach(id => searchParams.append('personaIds', id));
    }
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const data = await httpClient.get<PaginatedResponse<UseCase>>(
      `/api/use-cases?${searchParams.toString()}`
    );
    return {
      ...data,
      items: deserializeDatesArray(data.items),
    };
  },

  async listBySolution(solutionId: string): Promise<UseCase[]> {
    const url = `/api/use-cases?solutionId=${solutionId}`;
    const data = await httpClient.get<UseCase[]>(url);
    return deserializeDatesArray(data);
  },

  async get(id: string): Promise<UseCase | null> {
    try {
      const data = await httpClient.get<UseCase>(`/api/use-cases/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  },

  async create(data: CreateUseCaseDto): Promise<UseCase> {
    const result = await httpClient.post<UseCase>('/api/use-cases', data);
    return deserializeDates(result);
  },

  async update(id: string, updates: Partial<CreateUseCaseDto>): Promise<UseCase | null> {
    try {
      const result = await httpClient.put<UseCase>(`/api/use-cases/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/use-cases/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async findSimilar(request: FindSimilarUseCasesRequest): Promise<SimilarUseCaseResult[]> {
    const data = await httpClient.post<SimilarUseCaseResult[]>('/api/use-cases/similar', request);
    // Deserialize dates in nested useCase objects
    return data.map(result => ({
      ...result,
      useCase: deserializeDates(result.useCase),
    }));
  },

  async merge(request: MergeUseCasesRequest): Promise<UseCase> {
    const result = await httpClient.post<UseCase>('/api/use-cases/merge', request);
    return deserializeDates(result);
  },
};
