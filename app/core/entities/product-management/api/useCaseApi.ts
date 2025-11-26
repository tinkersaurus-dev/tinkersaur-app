import { v4 as uuidv4 } from 'uuid';
import type { UseCase, CreateUseCaseDto, UpdateUseCaseDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'useCases';

/**
 * UseCase API Client
 * Mock implementation with localStorage persistence
 */
class UseCaseApi {
  /**
   * Get all use cases for a solution
   */
  async listBySolution(solutionId: string): Promise<UseCase[]> {
    await simulateDelay();
    const useCases = getFromStorage<UseCase>(STORAGE_KEY);
    return useCases.filter((u) => u.solutionId === solutionId);
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
    await simulateDelay();
    const useCases = getFromStorage<UseCase>(STORAGE_KEY);
    return useCases.find((u) => u.id === id) || null;
  }

  /**
   * Create a new use case
   */
  async create(data: CreateUseCaseDto): Promise<UseCase> {
    await simulateDelay();

    const useCase: UseCase = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const useCases = getFromStorage<UseCase>(STORAGE_KEY);
    useCases.push(useCase);
    saveToStorage(STORAGE_KEY, useCases);

    return useCase;
  }

  /**
   * Update an existing use case
   */
  async update(id: string, updates: Partial<UpdateUseCaseDto>): Promise<UseCase | null> {
    await simulateDelay();

    const useCases = getFromStorage<UseCase>(STORAGE_KEY);
    const index = useCases.findIndex((u) => u.id === id);

    if (index === -1) {
      return null;
    }

    useCases[index] = {
      ...useCases[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, useCases);
    return useCases[index];
  }

  /**
   * Delete a use case
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const useCases = getFromStorage<UseCase>(STORAGE_KEY);
    const filtered = useCases.filter((u) => u.id !== id);

    if (filtered.length === useCases.length) {
      return false; // Use case not found
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }
}

export const useCaseApi = new UseCaseApi();
