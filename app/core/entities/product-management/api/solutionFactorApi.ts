import type {
  SolutionFactor,
  SolutionFactorType,
  CreateSolutionFactorDto,
  UpdateSolutionFactorDto,
  CreateSolutionFactorsBulkDto,
} from '../types/SolutionFactor';
import { httpClient, deserializeDates } from '~/core/api/httpClient';

const endpoint = '/api/solution-factors';

export const solutionFactorApi = {
  /**
   * Get all factors for a solution
   */
  async getBySolutionId(solutionId: string): Promise<SolutionFactor[]> {
    const data = await httpClient.get<SolutionFactor[]>(`${endpoint}/solution/${solutionId}`);
    return data.map(deserializeDates);
  },

  /**
   * Get factors by solution ID and type
   */
  async getBySolutionIdAndType(
    solutionId: string,
    type: SolutionFactorType
  ): Promise<SolutionFactor[]> {
    const data = await httpClient.get<SolutionFactor[]>(
      `${endpoint}/solution/${solutionId}/type/${type}`
    );
    return data.map(deserializeDates);
  },

  /**
   * Get a single factor by ID
   */
  async getById(id: string): Promise<SolutionFactor | null> {
    try {
      const data = await httpClient.get<SolutionFactor>(`${endpoint}/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  },

  /**
   * Create a single factor
   */
  async create(dto: CreateSolutionFactorDto): Promise<SolutionFactor> {
    const data = await httpClient.post<SolutionFactor>(endpoint, dto);
    return deserializeDates(data);
  },

  /**
   * Bulk create factors (for LLM generation)
   */
  async createBulk(dto: CreateSolutionFactorsBulkDto): Promise<SolutionFactor[]> {
    const data = await httpClient.post<SolutionFactor[]>(`${endpoint}/bulk`, dto);
    return data.map(deserializeDates);
  },

  /**
   * Update a factor by ID
   */
  async update(id: string, dto: UpdateSolutionFactorDto): Promise<SolutionFactor | null> {
    try {
      const data = await httpClient.put<SolutionFactor>(`${endpoint}/${id}`, dto);
      return deserializeDates(data);
    } catch {
      return null;
    }
  },

  /**
   * Delete a factor by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`${endpoint}/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Reorder factors within a type
   */
  async reorder(
    solutionId: string,
    type: SolutionFactorType,
    factorIds: string[]
  ): Promise<boolean> {
    try {
      await httpClient.put(`${endpoint}/solution/${solutionId}/type/${type}/reorder`, {
        factorIds,
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Delete all factors of a type (for regeneration)
   */
  async deleteByType(solutionId: string, type: SolutionFactorType): Promise<boolean> {
    try {
      await httpClient.delete(`${endpoint}/solution/${solutionId}/type/${type}`);
      return true;
    } catch {
      return false;
    }
  },
};
