import { v4 as uuidv4 } from 'uuid';
import type { User, CreateUserDto, UpdateUserDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'users';

/**
 * User API Client
 * Mock implementation with localStorage persistence
 */
class UserApi {
  /**
   * Get all users for a team
   */
  async list(teamId?: string): Promise<User[]> {
    await simulateDelay();
    const users = getFromStorage<User>(STORAGE_KEY);
    if (!teamId) {
      return [];
    }
    return users.filter((u) => u.teamId === teamId);
  }

  /**
   * Get a single user by ID
   */
  async get(id: string): Promise<User | null> {
    await simulateDelay();
    const users = getFromStorage<User>(STORAGE_KEY);
    return users.find((u) => u.id === id) || null;
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserDto): Promise<User> {
    await simulateDelay();

    const user: User = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const users = getFromStorage<User>(STORAGE_KEY);
    users.push(user);
    saveToStorage(STORAGE_KEY, users);

    return user;
  }

  /**
   * Update an existing user
   */
  async update(id: string, updates: Partial<UpdateUserDto>): Promise<User | null> {
    await simulateDelay();

    const users = getFromStorage<User>(STORAGE_KEY);
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      return null;
    }

    users[index] = {
      ...users[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, users);
    return users[index];
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const users = getFromStorage<User>(STORAGE_KEY);
    const filtered = users.filter((u) => u.id !== id);

    if (filtered.length === users.length) {
      return false; // User not found
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }
}

export const userApi = new UserApi();
