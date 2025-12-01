import { v4 as uuidv4 } from 'uuid';
import type { Solution, CreateSolutionDto, UpdateSolutionDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'solutions';

/**
 * Solution API Client
 * Mock implementation with localStorage persistence
 */
class SolutionApi {
  /**
   * Get all solutions for a team
   */
  async list(teamId?: string): Promise<Solution[]> {
    await simulateDelay();
    const solutions = getFromStorage<Solution>(STORAGE_KEY);
    if (!teamId) {
      return [];
    }
    return solutions.filter((s) => s.teamId === teamId);
  }

  /**
   * Get a single solution by ID
   */
  async get(id: string): Promise<Solution | null> {
    await simulateDelay();
    const solutions = getFromStorage<Solution>(STORAGE_KEY);
    return solutions.find((s) => s.id === id) || null;
  }

  /**
   * Create a new solution
   */
  async create(data: CreateSolutionDto): Promise<Solution> {
    await simulateDelay();

    const solution: Solution = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const solutions = getFromStorage<Solution>(STORAGE_KEY);
    solutions.push(solution);
    saveToStorage(STORAGE_KEY, solutions);

    return solution;
  }

  /**
   * Update an existing solution
   */
  async update(id: string, updates: Partial<UpdateSolutionDto>): Promise<Solution | null> {
    await simulateDelay();

    const solutions = getFromStorage<Solution>(STORAGE_KEY);
    const index = solutions.findIndex((s) => s.id === id);

    if (index === -1) {
      return null;
    }

    solutions[index] = {
      ...solutions[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, solutions);
    return solutions[index];
  }

  /**
   * Delete a solution
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const solutions = getFromStorage<Solution>(STORAGE_KEY);
    const filtered = solutions.filter((s) => s.id !== id);

    if (filtered.length === solutions.length) {
      return false; // Solution not found
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }
}

export const solutionApi = new SolutionApi();
