import { v4 as uuidv4 } from 'uuid';
import type { Feature, CreateFeatureDto, UpdateFeatureDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'features';

/**
 * Feature API Client
 * Mock implementation with localStorage persistence
 */
class FeatureApi {
  /**
   * Get all features for a solution
   */
  async listBySolution(solutionId: string): Promise<Feature[]> {
    await simulateDelay();
    const features = getFromStorage<Feature>(STORAGE_KEY);
    return features.filter((f) => f.solutionId === solutionId);
  }

  /**
   * Get a single feature by ID
   */
  async get(id: string): Promise<Feature | null> {
    await simulateDelay();
    const features = getFromStorage<Feature>(STORAGE_KEY);
    return features.find((f) => f.id === id) || null;
  }

  /**
   * Create a new feature
   */
  async create(data: CreateFeatureDto): Promise<Feature> {
    await simulateDelay();

    const feature: Feature = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const features = getFromStorage<Feature>(STORAGE_KEY);
    features.push(feature);
    saveToStorage(STORAGE_KEY, features);

    return feature;
  }

  /**
   * Update an existing feature
   */
  async update(id: string, updates: Partial<UpdateFeatureDto>): Promise<Feature | null> {
    await simulateDelay();

    const features = getFromStorage<Feature>(STORAGE_KEY);
    const index = features.findIndex((f) => f.id === id);

    if (index === -1) {
      return null;
    }

    features[index] = {
      ...features[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, features);
    return features[index];
  }

  /**
   * Delete a feature
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const features = getFromStorage<Feature>(STORAGE_KEY);
    const filtered = features.filter((f) => f.id !== id);

    if (filtered.length === features.length) {
      return false; // Feature not found
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }
}

export const featureApi = new FeatureApi();
