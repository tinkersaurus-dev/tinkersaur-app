import type { Requirement, CreateRequirementDto, UpdateRequirementDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * Requirement API Client
 * Real implementation with backend API
 */
class RequirementApi {
  /**
   * Get all requirements for a use case
   */
  async listByUseCase(useCaseId: string): Promise<Requirement[]> {
    const data = await httpClient.get<Requirement[]>(`/api/requirements?useCaseId=${useCaseId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Alias for listByUseCase to match generic store interface
   */
  async list(useCaseId?: string): Promise<Requirement[]> {
    if (!useCaseId) {
      return [];
    }
    return this.listByUseCase(useCaseId);
  }

  /**
   * Get a single requirement by ID
   */
  async get(id: string): Promise<Requirement | null> {
    try {
      const data = await httpClient.get<Requirement>(`/api/requirements/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new requirement
   */
  async create(data: CreateRequirementDto): Promise<Requirement> {
    const result = await httpClient.post<Requirement>('/api/requirements', data);
    return deserializeDates(result);
  }

  /**
   * Update an existing requirement
   */
  async update(id: string, updates: Partial<UpdateRequirementDto>): Promise<Requirement | null> {
    try {
      const result = await httpClient.put<Requirement>(`/api/requirements/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  }

  /**
   * Delete a requirement
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/requirements/${id}`);
      return true;
    } catch {
      return false;
    }
  }
}

export const requirementApi = new RequirementApi();
