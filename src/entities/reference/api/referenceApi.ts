import type { Reference, CreateReference, UpdateReference } from '../model/types';
import { httpClient, deserializeDates, deserializeDatesArray } from '@/shared/api';

/**
 * Reference API Client
 * Real implementation with backend API
 */
class ReferenceApi {
  /**
   * Get all references for a design work
   */
  async list(designWorkId: string): Promise<Reference[]> {
    const data = await httpClient.get<Reference[]>(`/api/references?designWorkId=${designWorkId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get a single reference by ID
   */
  async get(id: string): Promise<Reference | null> {
    try {
      const data = await httpClient.get<Reference>(`/api/references/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new reference
   */
  async create(data: CreateReference): Promise<Reference> {
    const result = await httpClient.post<Reference>('/api/references', data);
    return deserializeDates(result);
  }

  /**
   * Update an existing reference
   */
  async update(id: string, updates: Partial<UpdateReference>): Promise<Reference | null> {
    try {
      const result = await httpClient.put<Reference>(`/api/references/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  }

  /**
   * Delete a reference
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/references/${id}`);
      return true;
    } catch {
      return false;
    }
  }

}

export const referenceApi = new ReferenceApi();
