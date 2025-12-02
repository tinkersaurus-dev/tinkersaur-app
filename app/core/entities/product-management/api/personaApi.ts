import type { Persona, CreatePersonaDto, UpdatePersonaDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * Persona API Client
 * Real implementation with backend API
 */
class PersonaApi {
  /**
   * Get all personas for a team
   */
  async list(teamId?: string): Promise<Persona[]> {
    if (!teamId) {
      return [];
    }
    const data = await httpClient.get<Persona[]>(`/api/personas?teamId=${teamId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get a single persona by ID
   */
  async get(id: string): Promise<Persona | null> {
    try {
      const data = await httpClient.get<Persona>(`/api/personas/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new persona
   */
  async create(data: CreatePersonaDto): Promise<Persona> {
    const result = await httpClient.post<Persona>('/api/personas', data);
    return deserializeDates(result);
  }

  /**
   * Update an existing persona
   */
  async update(id: string, updates: Partial<UpdatePersonaDto>): Promise<Persona | null> {
    try {
      const result = await httpClient.put<Persona>(`/api/personas/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  }

  /**
   * Delete a persona
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/personas/${id}`);
      return true;
    } catch {
      return false;
    }
  }
}

export const personaApi = new PersonaApi();
