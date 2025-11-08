import { v4 as uuidv4 } from 'uuid';
import type { Interface, CreateInterfaceDto, UpdateInterfaceDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'interfaces';

class InterfaceApi {
  /**
   * Get all interfaces for a design work
   */
  async list(designWorkId: string): Promise<Interface[]> {
    await simulateDelay();
    const interfaces = getFromStorage<Interface>(STORAGE_KEY);
    return interfaces.filter((i) => i.designWorkId === designWorkId);
  }

  /**
   * Get a single interface by ID
   */
  async get(id: string): Promise<Interface | null> {
    await simulateDelay();
    const interfaces = getFromStorage<Interface>(STORAGE_KEY);
    return interfaces.find((i) => i.id === id) || null;
  }

  /**
   * Create a new interface
   */
  async create(data: CreateInterfaceDto): Promise<Interface> {
    await simulateDelay();

    const interfaceItem: Interface = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const interfaces = getFromStorage<Interface>(STORAGE_KEY);
    interfaces.push(interfaceItem);
    saveToStorage(STORAGE_KEY, interfaces);

    return interfaceItem;
  }

  /**
   * Update an existing interface
   */
  async update(id: string, updates: Partial<UpdateInterfaceDto>): Promise<Interface | null> {
    await simulateDelay();

    const interfaces = getFromStorage<Interface>(STORAGE_KEY);
    const index = interfaces.findIndex((i) => i.id === id);

    if (index === -1) {
      return null;
    }

    interfaces[index] = {
      ...interfaces[index],
      ...updates,
      id,
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, interfaces);
    return interfaces[index];
  }

  /**
   * Delete an interface
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const interfaces = getFromStorage<Interface>(STORAGE_KEY);
    const filtered = interfaces.filter((i) => i.id !== id);

    if (filtered.length === interfaces.length) {
      return false;
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }

  /**
   * Delete all interfaces for a design work
   */
  async deleteByDesignWorkId(designWorkId: string): Promise<number> {
    await simulateDelay();

    const interfaces = getFromStorage<Interface>(STORAGE_KEY);
    const filtered = interfaces.filter((i) => i.designWorkId !== designWorkId);
    const deletedCount = interfaces.length - filtered.length;

    saveToStorage(STORAGE_KEY, filtered);
    return deletedCount;
  }
}

export const interfaceApi = new InterfaceApi();
