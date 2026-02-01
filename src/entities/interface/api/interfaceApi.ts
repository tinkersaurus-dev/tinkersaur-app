import type { Interface, CreateInterfaceDto, UpdateInterfaceDto } from '../model/types';
import { httpClient, deserializeDates, deserializeDatesArray } from '@/shared/api';

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
  async get(id: string): Promise<Interface> {
    const data = await httpClient.get<Interface>(`/api/interfaces/${id}`);
    return deserializeDates(data);
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
  async update(id: string, updates: Partial<UpdateInterfaceDto>): Promise<Interface> {
    const result = await httpClient.put<Interface>(`/api/interfaces/${id}`, updates);
    return deserializeDates(result);
  }

  /**
   * Delete an interface
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/api/interfaces/${id}`);
  }

  /**
   * Delete all interfaces for a design work
   */
  async deleteByDesignWorkId(designWorkId: string): Promise<number> {
    const interfaces = await this.list(designWorkId);
    for (const iface of interfaces) {
      await this.delete(iface.id);
    }
    return interfaces.length;
  }
}

export const interfaceApi = new InterfaceApi();
