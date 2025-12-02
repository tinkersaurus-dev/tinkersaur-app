import type { User, CreateUserDto, UpdateUserDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * User API Client
 * Real implementation with backend API
 */
class UserApi {
  /**
   * Get all users for a team
   */
  async list(teamId?: string): Promise<User[]> {
    if (!teamId) {
      return [];
    }
    const data = await httpClient.get<User[]>(`/api/users?teamId=${teamId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get a single user by ID
   */
  async get(id: string): Promise<User | null> {
    try {
      const data = await httpClient.get<User>(`/api/users/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserDto): Promise<User> {
    const result = await httpClient.post<User>('/api/users', data);
    return deserializeDates(result);
  }

  /**
   * Update an existing user
   */
  async update(id: string, updates: Partial<UpdateUserDto>): Promise<User | null> {
    try {
      const result = await httpClient.put<User>(`/api/users/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/users/${id}`);
      return true;
    } catch {
      return false;
    }
  }
}

export const userApi = new UserApi();
