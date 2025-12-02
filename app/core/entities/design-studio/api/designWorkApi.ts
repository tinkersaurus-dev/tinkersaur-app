import type { DesignWork, CreateDesignWorkDto, UpdateDesignWorkDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * Normalize a DesignWork response by ensuring arrays have defaults
 */
function normalizeDesignWork(dw: DesignWork): DesignWork {
  return {
    ...dw,
    diagrams: dw.diagrams || [],
    interfaces: dw.interfaces || [],
    documents: dw.documents || [],
    references: dw.references || [],
  };
}

/**
 * DesignWork API Client
 * Real implementation with backend API
 */
class DesignWorkApi {
  /**
   * Get all design works for a solution
   */
  async list(solutionId: string): Promise<DesignWork[]> {
    const data = await httpClient.get<DesignWork[]>(`/api/design-works?solutionId=${solutionId}`);
    return deserializeDatesArray(data).map(normalizeDesignWork);
  }

  /**
   * Get a single design work by ID
   */
  async get(id: string): Promise<DesignWork | null> {
    try {
      const data = await httpClient.get<DesignWork>(`/api/design-works/${id}`);
      return normalizeDesignWork(deserializeDates(data));
    } catch {
      return null;
    }
  }

  /**
   * Create a new design work
   */
  async create(data: CreateDesignWorkDto): Promise<DesignWork> {
    const result = await httpClient.post<DesignWork>('/api/design-works', data);
    return normalizeDesignWork(deserializeDates(result));
  }

  /**
   * Update an existing design work
   */
  async update(id: string, updates: Partial<UpdateDesignWorkDto>): Promise<DesignWork | null> {
    try {
      const result = await httpClient.put<DesignWork>(`/api/design-works/${id}`, updates);
      return normalizeDesignWork(deserializeDates(result));
    } catch {
      return null;
    }
  }

  /**
   * Delete a design work
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/design-works/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all descendant IDs recursively (for cascade delete)
   * Note: This is computed client-side by fetching design works and traversing the hierarchy
   */
  async getAllDescendantIds(id: string): Promise<string[]> {
    // Get the design work to find its solution
    const designWork = await this.get(id);
    if (!designWork) return [];

    // Get all design works for the solution
    const allDesignWorks = await this.list(designWork.solutionId);
    const allIds: string[] = [];

    const collectDescendants = (parentId: string) => {
      const children = allDesignWorks.filter((dw) => dw.parentDesignWorkId === parentId);
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
