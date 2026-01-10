import type { SolutionOverview, UpdateSolutionOverviewDto } from '../types/SolutionOverview';
import { httpClient, deserializeDates } from '~/core/api/httpClient';

const endpoint = '/api/solution-overviews';

export const solutionOverviewApi = {
  /**
   * Get overview by solution ID
   * Backend auto-creates an empty overview if none exists
   */
  async getBySolutionId(solutionId: string): Promise<SolutionOverview | null> {
    try {
      const data = await httpClient.get<SolutionOverview>(`${endpoint}/solution/${solutionId}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  },

  /**
   * Update overview by ID
   */
  async update(id: string, updates: UpdateSolutionOverviewDto): Promise<SolutionOverview | null> {
    try {
      const result = await httpClient.put<SolutionOverview>(`${endpoint}/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  },
};
