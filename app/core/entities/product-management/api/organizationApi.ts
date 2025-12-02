import type { Organization, CreateOrganizationDto, UpdateOrganizationDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * Organization API Client
 * Real implementation with backend API
 */
class OrganizationApi {
  /**
   * Get all organizations
   */
  async list(): Promise<Organization[]> {
    const data = await httpClient.get<Organization[]>('/api/organizations');
    return deserializeDatesArray(data);
  }

  /**
   * Get a single organization by ID
   */
  async get(id: string): Promise<Organization | null> {
    try {
      const data = await httpClient.get<Organization>(`/api/organizations/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new organization
   */
  async create(data: CreateOrganizationDto): Promise<Organization> {
    const result = await httpClient.post<Organization>('/api/organizations', data);
    return deserializeDates(result);
  }

  /**
   * Update an existing organization
   */
  async update(id: string, updates: Partial<UpdateOrganizationDto>): Promise<Organization | null> {
    try {
      const result = await httpClient.put<Organization>(`/api/organizations/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  }

  /**
   * Delete an organization
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/organizations/${id}`);
      return true;
    } catch {
      return false;
    }
  }
}

export const organizationApi = new OrganizationApi();
