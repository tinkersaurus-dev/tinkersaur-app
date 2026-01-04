import type { Persona, CreatePersonaDto } from '../types';
import type { PaginatedResponse, PersonaListParams } from '~/core/api/types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

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

    const data = await httpClient.get<PaginatedResponse<Persona>>(
      `/api/personas?${searchParams.toString()}`
    );
    return {
      ...data,
      items: deserializeDatesArray(data.items),
    };
  },

  async get(id: string): Promise<Persona | null> {
    try {
      const data = await httpClient.get<Persona>(`/api/personas/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  },

  async create(data: CreatePersonaDto): Promise<Persona> {
    const result = await httpClient.post<Persona>('/api/personas', data);
    return deserializeDates(result);
  },

  async update(id: string, updates: Partial<CreatePersonaDto>): Promise<Persona | null> {
    try {
      const result = await httpClient.put<Persona>(`/api/personas/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/personas/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
