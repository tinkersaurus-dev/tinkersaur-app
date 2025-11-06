import { v4 as uuidv4 } from 'uuid';
import type { DesignWork, CreateDesignWorkDto, UpdateDesignWorkDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'designWorks';

class DesignWorkApi {
  /**
   * Get all design works for a solution
   */
  async list(solutionId: string): Promise<DesignWork[]> {
    await simulateDelay();
    const designWorks = getFromStorage<DesignWork>(STORAGE_KEY);
    return designWorks.filter((dw) => dw.solutionId === solutionId);
  }

  /**
   * Get a single design work by ID
   */
  async get(id: string): Promise<DesignWork | null> {
    await simulateDelay();
    const designWorks = getFromStorage<DesignWork>(STORAGE_KEY);
    return designWorks.find((dw) => dw.id === id) || null;
  }

  /**
   * Get child design works (nested folders)
   */
  async getChildren(parentDesignWorkId: string): Promise<DesignWork[]> {
    await simulateDelay();
    const designWorks = getFromStorage<DesignWork>(STORAGE_KEY);
    return designWorks.filter((dw) => dw.parentDesignWorkId === parentDesignWorkId);
  }

  /**
   * Get root design works (top-level folders with no parent)
   */
  async getRoots(solutionId: string): Promise<DesignWork[]> {
    await simulateDelay();
    const designWorks = getFromStorage<DesignWork>(STORAGE_KEY);
    return designWorks.filter((dw) => dw.solutionId === solutionId && !dw.parentDesignWorkId);
  }

  /**
   * Create a new design work
   */
  async create(data: CreateDesignWorkDto): Promise<DesignWork> {
    await simulateDelay();

    const designWork: DesignWork = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const designWorks = getFromStorage<DesignWork>(STORAGE_KEY);
    designWorks.push(designWork);
    saveToStorage(STORAGE_KEY, designWorks);

    return designWork;
  }

  /**
   * Update an existing design work
   */
  async update(id: string, updates: Partial<UpdateDesignWorkDto>): Promise<DesignWork | null> {
    await simulateDelay();

    const designWorks = getFromStorage<DesignWork>(STORAGE_KEY);
    const index = designWorks.findIndex((dw) => dw.id === id);

    if (index === -1) {
      return null;
    }

    designWorks[index] = {
      ...designWorks[index],
      ...updates,
      id,
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, designWorks);
    return designWorks[index];
  }

  /**
   * Delete a design work
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const designWorks = getFromStorage<DesignWork>(STORAGE_KEY);
    const filtered = designWorks.filter((dw) => dw.id !== id);

    if (filtered.length === designWorks.length) {
      return false;
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }

  /**
   * Get all descendant IDs recursively (for cascade delete)
   */
  async getAllDescendantIds(id: string): Promise<string[]> {
    await simulateDelay();

    const designWorks = getFromStorage<DesignWork>(STORAGE_KEY);
    const allIds: string[] = [];

    const collectDescendants = (parentId: string) => {
      const children = designWorks.filter((dw) => dw.parentDesignWorkId === parentId);
      children.forEach((child) => {
        allIds.push(child.id);
        collectDescendants(child.id);
      });
    };

    collectDescendants(id);
    return allIds;
  }
}

export const designWorkApi = new DesignWorkApi();
