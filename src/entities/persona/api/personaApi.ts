import type { Persona, CreatePersonaDto, FindSimilarPersonasRequest, SimilarPersonaResult, MergePersonasRequest } from '../model/types';
import type { PaginatedResponse, PersonaListParams } from '@/shared/api';
import { httpClient, deserializeDates, deserializeDatesArray } from '@/shared/api';

export const personaApi = {
  async list(teamId: string): Promise<Persona[]> {
    const url = `/api/personas?teamId=${teamId}`;
    const data = await httpClient.get<Persona[]>(url);
    return deserializeDatesArray(data);
  },

  async listPaginated(params: PersonaListParams): Promise<PaginatedResponse<Persona>> {
    const searchParams = new URLSearchParams();
    searchParams.set('teamId', params.teamId);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.solutionId) searchParams.set('solutionId', params.solutionId);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const data = await httpClient.get<PaginatedResponse<Persona>>(
      `/api/personas?${searchParams.toString()}`
    );
    return {
      ...data,
      items: deserializeDatesArray(data.items),
    };
  },

  async get(id: string): Promise<Persona> {
    const data = await httpClient.get<Persona>(`/api/personas/${id}`);
    return deserializeDates(data);
  },

  async create(data: CreatePersonaDto): Promise<Persona> {
    const result = await httpClient.post<Persona>('/api/personas', data);
    return deserializeDates(result);
  },

  async update(id: string, updates: Partial<CreatePersonaDto>): Promise<Persona> {
    const result = await httpClient.put<Persona>(`/api/personas/${id}`, updates);
    return deserializeDates(result);
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/api/personas/${id}`);
  },

  async findSimilar(request: FindSimilarPersonasRequest): Promise<SimilarPersonaResult[]> {
    const data = await httpClient.post<SimilarPersonaResult[]>('/api/personas/similar', request);
    // Deserialize dates in nested persona objects
    return data.map(result => ({
      ...result,
      persona: deserializeDates(result.persona),
    }));
  },

  async merge(request: MergePersonasRequest): Promise<Persona> {
    const result = await httpClient.post<Persona>('/api/personas/merge', request);
    return deserializeDates(result);
  },
};
