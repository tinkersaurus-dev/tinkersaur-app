import { httpClient, deserializeDates, deserializeDatesArray } from './httpClient';

interface EntityApiConfig {
  endpoint: string;
  parentParam?: string;
}

export interface EntityApi<T, TCreate> {
  list(parentId?: string): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(data: TCreate): Promise<T>;
  update(id: string, updates: Partial<TCreate>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export function createEntityApi<T extends Record<string, unknown>, TCreate>(
  config: EntityApiConfig
): EntityApi<T, TCreate> {
  const { endpoint, parentParam } = config;

  return {
    async list(parentId?: string): Promise<T[]> {
      if (parentParam && !parentId) return [];
      const url = parentParam && parentId
        ? `${endpoint}?${parentParam}=${parentId}`
        : endpoint;
      const data = await httpClient.get<T[]>(url);
      return deserializeDatesArray(data);
    },

    async get(id: string): Promise<T | null> {
      try {
        const data = await httpClient.get<T>(`${endpoint}/${id}`);
        return deserializeDates(data);
      } catch {
        return null;
      }
    },

    async create(data: TCreate): Promise<T> {
      const result = await httpClient.post<T>(endpoint, data);
      return deserializeDates(result);
    },

    async update(id: string, updates: Partial<TCreate>): Promise<T | null> {
      try {
        const result = await httpClient.put<T>(`${endpoint}/${id}`, updates);
        return deserializeDates(result);
      } catch {
        return null;
      }
    },

    async delete(id: string): Promise<boolean> {
      try {
        await httpClient.delete(`${endpoint}/${id}`);
        return true;
      } catch {
        return false;
      }
    },
  };
}
