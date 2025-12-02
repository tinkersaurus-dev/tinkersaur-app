import type { Team, CreateTeamDto, UpdateTeamDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * Team API Client
 * Real implementation with backend API
 */
class TeamApi {
  /**
   * Get all teams for an organization
   */
  async list(organizationId?: string): Promise<Team[]> {
    if (!organizationId) {
      return [];
    }
    const data = await httpClient.get<Team[]>(`/api/teams?organizationId=${organizationId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get a single team by ID
   */
  async get(id: string): Promise<Team | null> {
    try {
      const data = await httpClient.get<Team>(`/api/teams/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new team
   */
  async create(data: CreateTeamDto): Promise<Team> {
    const result = await httpClient.post<Team>('/api/teams', data);
    return deserializeDates(result);
  }

  /**
   * Update an existing team
   */
  async update(id: string, updates: Partial<UpdateTeamDto>): Promise<Team | null> {
    try {
      const result = await httpClient.put<Team>(`/api/teams/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  }

  /**
   * Delete a team
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/teams/${id}`);
      return true;
    } catch {
      return false;
    }
  }
}

export const teamApi = new TeamApi();
