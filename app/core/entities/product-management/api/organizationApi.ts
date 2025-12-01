import { v4 as uuidv4 } from 'uuid';
import type { Organization, CreateOrganizationDto, UpdateOrganizationDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'organizations';

/**
 * Organization API Client
 * Mock implementation with localStorage persistence
 */
class OrganizationApi {
  /**
   * Get all organizations
   */
  async list(): Promise<Organization[]> {
    await simulateDelay();
    return getFromStorage<Organization>(STORAGE_KEY);
  }

  /**
   * Get a single organization by ID
   */
  async get(id: string): Promise<Organization | null> {
    await simulateDelay();
    const organizations = getFromStorage<Organization>(STORAGE_KEY);
    return organizations.find((o) => o.id === id) || null;
  }

  /**
   * Create a new organization
   */
  async create(data: CreateOrganizationDto): Promise<Organization> {
    await simulateDelay();

    const organization: Organization = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const organizations = getFromStorage<Organization>(STORAGE_KEY);
    organizations.push(organization);
    saveToStorage(STORAGE_KEY, organizations);

    return organization;
  }

  /**
   * Update an existing organization
   */
  async update(id: string, updates: Partial<UpdateOrganizationDto>): Promise<Organization | null> {
    await simulateDelay();

    const organizations = getFromStorage<Organization>(STORAGE_KEY);
    const index = organizations.findIndex((o) => o.id === id);

    if (index === -1) {
      return null;
    }

    organizations[index] = {
      ...organizations[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, organizations);
    return organizations[index];
  }

  /**
   * Delete an organization
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const organizations = getFromStorage<Organization>(STORAGE_KEY);
    const filtered = organizations.filter((o) => o.id !== id);

    if (filtered.length === organizations.length) {
      return false; // Organization not found
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }
}

export const organizationApi = new OrganizationApi();
