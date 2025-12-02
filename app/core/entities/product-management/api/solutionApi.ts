import type { Solution, CreateSolutionDto, UpdateSolutionDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * Solution API Client
 * Real implementation with backend API
 */
class SolutionApi {
  /**
   * Get all solutions for a team
   */
  async list(teamId?: string): Promise<Solution[]> {
    if (!teamId) {
      return [];
    }
    const data = await httpClient.get<Solution[]>(`/api/solutions?teamId=${teamId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get a single solution by ID
   */
  async get(id: string): Promise<Solution | null> {
    try {
      const data = await httpClient.get<Solution>(`/api/solutions/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new solution
   */
  async create(data: CreateSolutionDto): Promise<Solution> {
    const result = await httpClient.post<Solution>('/api/solutions', data);
    return deserializeDates(result);
  }

  /**
   * Update an existing solution
   */
  async update(id: string, updates: Partial<UpdateSolutionDto>): Promise<Solution | null> {
    try {
      const result = await httpClient.put<Solution>(`/api/solutions/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  }

  /**
   * Delete a solution
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/solutions/${id}`);
      return true;
    } catch {
      return false;
    }
  }
}

export const solutionApi = new SolutionApi();
