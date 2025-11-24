import { v4 as uuidv4 } from 'uuid';
import type { Reference, CreateReference, UpdateReference } from '../types/Reference';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'references';

class ReferenceApi {
  /**
   * Get all references for a design work
   */
  async list(_designWorkId: string): Promise<Reference[]> {
    await simulateDelay();
    const references = getFromStorage<Reference>(STORAGE_KEY);
    return references.filter((_r) => {
      // References are associated with content items in a design work
      // We'll need to check if the contentId belongs to this design work
      // For now, we'll return all - the store will filter appropriately
      return true;
    });
  }

  /**
   * Get all references for a specific content item (diagram, document, interface)
   */
  async getByContentId(contentId: string): Promise<Reference[]> {
    await simulateDelay();
    const references = getFromStorage<Reference>(STORAGE_KEY);
    return references.filter((r) => r.contentId === contentId);
  }

  /**
   * Get a reference by its source shape ID
   */
  async getBySourceShapeId(sourceShapeId: string): Promise<Reference | null> {
    await simulateDelay();
    const references = getFromStorage<Reference>(STORAGE_KEY);
    return references.find((r) => r.sourceShapeId === sourceShapeId) || null;
  }

  /**
   * Get a single reference by ID
   */
  async get(id: string): Promise<Reference | null> {
    await simulateDelay();
    const references = getFromStorage<Reference>(STORAGE_KEY);
    return references.find((r) => r.id === id) || null;
  }

  /**
   * Create a new reference
   */
  async create(data: CreateReference): Promise<Reference> {
    await simulateDelay();

    const reference: Reference = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const references = getFromStorage<Reference>(STORAGE_KEY);
    references.push(reference);
    saveToStorage(STORAGE_KEY, references);

    return reference;
  }

  /**
   * Update an existing reference
   */
  async update(id: string, updates: Partial<UpdateReference>): Promise<Reference | null> {
    await simulateDelay();

    const references = getFromStorage<Reference>(STORAGE_KEY);
    const index = references.findIndex((r) => r.id === id);

    if (index === -1) {
      return null;
    }

    references[index] = {
      ...references[index],
      ...updates,
      id,
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, references);
    return references[index];
  }

  /**
   * Delete a reference
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const references = getFromStorage<Reference>(STORAGE_KEY);
    const filtered = references.filter((r) => r.id !== id);

    if (filtered.length === references.length) {
      return false;
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }

  /**
   * Delete a reference by source shape ID
   * Used when a shape is deleted to clean up its reference
   */
  async deleteBySourceShapeId(sourceShapeId: string): Promise<boolean> {
    await simulateDelay();

    const references = getFromStorage<Reference>(STORAGE_KEY);
    const filtered = references.filter((r) => r.sourceShapeId !== sourceShapeId);

    if (filtered.length === references.length) {
      return false;
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }

  /**
   * Delete all references for a content item
   */
  async deleteByContentId(contentId: string): Promise<number> {
    await simulateDelay();

    const references = getFromStorage<Reference>(STORAGE_KEY);
    const filtered = references.filter((r) => r.contentId !== contentId);
    const deletedCount = references.length - filtered.length;

    saveToStorage(STORAGE_KEY, filtered);
    return deletedCount;
  }
}

export const referenceApi = new ReferenceApi();
