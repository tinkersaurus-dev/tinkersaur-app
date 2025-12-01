import { v4 as uuidv4 } from 'uuid';
import type { Team, CreateTeamDto, UpdateTeamDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'teams';

/**
 * Team API Client
 * Mock implementation with localStorage persistence
 */
class TeamApi {
  /**
   * Get all teams for an organization
   */
  async list(organizationId?: string): Promise<Team[]> {
    await simulateDelay();
    const teams = getFromStorage<Team>(STORAGE_KEY);
    if (!organizationId) {
      return [];
    }
    return teams.filter((t) => t.organizationId === organizationId);
  }

  /**
   * Get a single team by ID
   */
  async get(id: string): Promise<Team | null> {
    await simulateDelay();
    const teams = getFromStorage<Team>(STORAGE_KEY);
    return teams.find((t) => t.id === id) || null;
  }

  /**
   * Create a new team
   */
  async create(data: CreateTeamDto): Promise<Team> {
    await simulateDelay();

    const team: Team = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const teams = getFromStorage<Team>(STORAGE_KEY);
    teams.push(team);
    saveToStorage(STORAGE_KEY, teams);

    return team;
  }

  /**
   * Update an existing team
   */
  async update(id: string, updates: Partial<UpdateTeamDto>): Promise<Team | null> {
    await simulateDelay();

    const teams = getFromStorage<Team>(STORAGE_KEY);
    const index = teams.findIndex((t) => t.id === id);

    if (index === -1) {
      return null;
    }

    teams[index] = {
      ...teams[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, teams);
    return teams[index];
  }

  /**
   * Delete a team
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const teams = getFromStorage<Team>(STORAGE_KEY);
    const filtered = teams.filter((t) => t.id !== id);

    if (filtered.length === teams.length) {
      return false; // Team not found
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }
}

export const teamApi = new TeamApi();
