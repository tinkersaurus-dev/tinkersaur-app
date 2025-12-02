import type { Interface, CreateInterfaceDto, UpdateInterfaceDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * Interface API Client
 * Real implementation with backend API
 */
class InterfaceApi {
  /**
   * Get all interfaces for a design work
   */
  async list(designWorkId: string): Promise<Interface[]> {
    const data = await httpClient.get<Interface[]>(`/api/interfaces?designWorkId=${designWorkId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get a single interface by ID
   */
  async get(id: string): Promise<Interface | null> {
    try {
      const data = await httpClient.get<Interface>(`/api/interfaces/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new interface
   */
  async create(data: CreateInterfaceDto): Promise<Interface> {
    const result = await httpClient.post<Interface>('/api/interfaces', data);
    return deserializeDates(result);
  }

  /**
   * Update an existing interface
   */
  async update(id: string, updates: Partial<UpdateInterfaceDto>): Promise<Interface | null> {
    try {
      const result = await httpClient.put<Interface>(`/api/interfaces/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  }

  /**
   * Delete an interface
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/interfaces/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete all interfaces for a design work
   */
  async deleteByDesignWorkId(designWorkId: string): Promise<number> {
    try {
      const interfaces = await this.list(designWorkId);
      let deletedCount = 0;
      for (const iface of interfaces) {
        const success = await this.delete(iface.id);
        if (success) deletedCount++;
      }
      return deletedCount;
    } catch {
      return 0;
    }
  }
}

export const interfaceApi = new InterfaceApi();
