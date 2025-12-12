import type { PersonaUseCase, CreatePersonaUseCaseDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * PersonaUseCase API Client
 * Real implementation with backend API for the junction table
 */
class PersonaUseCaseApi {
  /**
   * Get all persona-usecase links for a persona
   */
  async listByPersona(personaId: string): Promise<PersonaUseCase[]> {
    const data = await httpClient.get<PersonaUseCase[]>(`/api/persona-use-cases?personaId=${personaId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get all persona-usecase links for a use case
   */
  async listByUseCase(useCaseId: string): Promise<PersonaUseCase[]> {
    const data = await httpClient.get<PersonaUseCase[]>(`/api/persona-use-cases?useCaseId=${useCaseId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get a single link by ID
   */
  async get(id: string): Promise<PersonaUseCase | null> {
    try {
      const data = await httpClient.get<PersonaUseCase>(`/api/persona-use-cases/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Check if a link already exists between a persona and use case
   */
  async exists(personaId: string, useCaseId: string): Promise<boolean> {
    try {
      const data = await httpClient.get<PersonaUseCase[]>(
        `/api/persona-use-cases?personaId=${personaId}&useCaseId=${useCaseId}`
      );
      return data.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Create a new persona-usecase link
   */
  async create(data: CreatePersonaUseCaseDto): Promise<PersonaUseCase> {
    const result = await httpClient.post<PersonaUseCase>('/api/persona-use-cases', data);
    return deserializeDates(result);
  }

  /**
   * Delete a link by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/persona-use-cases/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete all links for a persona
   */
  async deleteByPersonaId(personaId: string): Promise<number> {
    try {
      const links = await this.listByPersona(personaId);
      let deletedCount = 0;
      for (const link of links) {
        const success = await this.delete(link.id);
        if (success) deletedCount++;
      }
      return deletedCount;
    } catch {
      return 0;
    }
  }

  /**
   * Delete all links for a use case
   */
  async deleteByUseCaseId(useCaseId: string): Promise<number> {
    try {
      const links = await this.listByUseCase(useCaseId);
      let deletedCount = 0;
      for (const link of links) {
        const success = await this.delete(link.id);
        if (success) deletedCount++;
      }
      return deletedCount;
    } catch {
      return 0;
    }
  }
}

export const personaUseCaseApi = new PersonaUseCaseApi();
