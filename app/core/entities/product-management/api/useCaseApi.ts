import type { UseCase, CreateUseCaseDto, UpdateUseCaseDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * UseCase API Client
 * Real implementation with backend API
 */
class UseCaseApi {
  /**
   * Get all use cases for a solution
   */
  async listBySolution(solutionId: string): Promise<UseCase[]> {
    const data = await httpClient.get<UseCase[]>(`/api/use-cases?solutionId=${solutionId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Alias for listBySolution to match generic store interface
   */
  async list(solutionId?: string): Promise<UseCase[]> {
    if (!solutionId) {
      return [];
    }
    return this.listBySolution(solutionId);
  }

  /**
   * Get a single use case by ID
   */
  async get(id: string): Promise<UseCase | null> {
    try {
      const data = await httpClient.get<UseCase>(`/api/use-cases/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new use case
   */
  async create(data: CreateUseCaseDto): Promise<UseCase> {
    const result = await httpClient.post<UseCase>('/api/use-cases', data);
    return deserializeDates(result);
  }

  /**
   * Update an existing use case
   */
  async update(id: string, updates: Partial<UpdateUseCaseDto>): Promise<UseCase | null> {
    try {
      const result = await httpClient.put<UseCase>(`/api/use-cases/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  }

  /**
   * Delete a use case
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/use-cases/${id}`);
      return true;
    } catch {
      return false;
    }
  }
}

export const useCaseApi = new UseCaseApi();
