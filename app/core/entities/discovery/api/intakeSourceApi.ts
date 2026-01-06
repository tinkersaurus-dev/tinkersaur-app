import type { IntakeSource, CreateIntakeSourceDto, UpdateIntakeSourceDto } from '../types/IntakeSource';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

export const intakeSourceApi = {
  async list(teamId: string): Promise<IntakeSource[]> {
    const url = `/api/intake-sources?teamId=${teamId}`;
    const data = await httpClient.get<IntakeSource[]>(url);
    return deserializeDatesArray(data);
  },

  async get(id: string): Promise<IntakeSource | null> {
    try {
      const data = await httpClient.get<IntakeSource>(`/api/intake-sources/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  },

  async create(data: CreateIntakeSourceDto): Promise<IntakeSource> {
    const result = await httpClient.post<IntakeSource>('/api/intake-sources', data);
    return deserializeDates(result);
  },

  async update(id: string, updates: UpdateIntakeSourceDto): Promise<IntakeSource | null> {
    try {
      const result = await httpClient.put<IntakeSource>(`/api/intake-sources/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/intake-sources/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
