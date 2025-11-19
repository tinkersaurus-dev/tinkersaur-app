import { v4 as uuidv4 } from 'uuid';
import type { Change, CreateChangeDto, UpdateChangeDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'changes';

/**
 * Change API Client
 * Mock implementation with localStorage persistence
 */
class ChangeApi {
  /**
   * Get all changes for a feature
   */
  async listByFeature(featureId: string): Promise<Change[]> {
    await simulateDelay();
    const changes = getFromStorage<Change>(STORAGE_KEY);
    return changes.filter((c) => c.featureId === featureId);
  }

  /**
   * Alias for listByFeature to match generic store interface
   */
  async list(featureId?: string): Promise<Change[]> {
    if (!featureId) {
      return [];
    }
    return this.listByFeature(featureId);
  }

  /**
   * Get a single change by ID
   */
  async get(id: string): Promise<Change | null> {
    await simulateDelay();
    const changes = getFromStorage<Change>(STORAGE_KEY);
    return changes.find((c) => c.id === id) || null;
  }

  /**
   * Create a new change
   */
  async create(data: CreateChangeDto): Promise<Change> {
    await simulateDelay();

    const change: Change = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const changes = getFromStorage<Change>(STORAGE_KEY);
    changes.push(change);
    saveToStorage(STORAGE_KEY, changes);

    return change;
  }

  /**
   * Update an existing change
   */
  async update(id: string, updates: Partial<UpdateChangeDto>): Promise<Change | null> {
    await simulateDelay();

    const changes = getFromStorage<Change>(STORAGE_KEY);
    const index = changes.findIndex((c) => c.id === id);

    if (index === -1) {
      return null;
    }

    changes[index] = {
      ...changes[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, changes);
    return changes[index];
  }

  /**
   * Delete a change
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const changes = getFromStorage<Change>(STORAGE_KEY);
    const filtered = changes.filter((c) => c.id !== id);

    if (filtered.length === changes.length) {
      return false; // Change not found
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }
}

export const changeApi = new ChangeApi();
