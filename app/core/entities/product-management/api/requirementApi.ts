import { v4 as uuidv4 } from 'uuid';
import type { Requirement, CreateRequirementDto, UpdateRequirementDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'requirements';

/**
 * Requirement API Client
 * Mock implementation with localStorage persistence
 */
class RequirementApi {
  /**
   * Get all requirements for a change
   */
  async listByChange(changeId: string): Promise<Requirement[]> {
    await simulateDelay();
    const requirements = getFromStorage<Requirement>(STORAGE_KEY);
    return requirements.filter((r) => r.changeId === changeId);
  }

  /**
   * Alias for listByChange to match generic store interface
   */
  async list(changeId?: string): Promise<Requirement[]> {
    if (!changeId) {
      return [];
    }
    return this.listByChange(changeId);
  }

  /**
   * Get a single requirement by ID
   */
  async get(id: string): Promise<Requirement | null> {
    await simulateDelay();
    const requirements = getFromStorage<Requirement>(STORAGE_KEY);
    return requirements.find((r) => r.id === id) || null;
  }

  /**
   * Create a new requirement
   */
  async create(data: CreateRequirementDto): Promise<Requirement> {
    await simulateDelay();

    const requirement: Requirement = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const requirements = getFromStorage<Requirement>(STORAGE_KEY);
    requirements.push(requirement);
    saveToStorage(STORAGE_KEY, requirements);

    return requirement;
  }

  /**
   * Update an existing requirement
   */
  async update(id: string, updates: Partial<UpdateRequirementDto>): Promise<Requirement | null> {
    await simulateDelay();

    const requirements = getFromStorage<Requirement>(STORAGE_KEY);
    const index = requirements.findIndex((r) => r.id === id);

    if (index === -1) {
      return null;
    }

    requirements[index] = {
      ...requirements[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, requirements);
    return requirements[index];
  }

  /**
   * Delete a requirement
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const requirements = getFromStorage<Requirement>(STORAGE_KEY);
    const filtered = requirements.filter((r) => r.id !== id);

    if (filtered.length === requirements.length) {
      return false; // Requirement not found
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }
}

export const requirementApi = new RequirementApi();
