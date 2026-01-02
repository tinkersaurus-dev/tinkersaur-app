import type { UseCase, CreateUseCaseDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

export const useCaseApi = {
  async listByTeam(teamId: string, unassignedOnly = false): Promise<UseCase[]> {
    const url = `/api/use-cases?teamId=${teamId}${unassignedOnly ? '&unassignedOnly=true' : ''}`;
    const data = await httpClient.get<UseCase[]>(url);
    return deserializeDatesArray(data);
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
};
