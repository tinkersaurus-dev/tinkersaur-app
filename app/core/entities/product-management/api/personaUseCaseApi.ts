import { v4 as uuidv4 } from 'uuid';
import type { PersonaUseCase, CreatePersonaUseCaseDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'personaUseCases';

/**
 * PersonaUseCase API Client
 * Mock implementation with localStorage persistence for the junction table
 */
class PersonaUseCaseApi {
  /**
   * Get all persona-usecase links for a persona
   */
  async listByPersona(personaId: string): Promise<PersonaUseCase[]> {
    await simulateDelay();
    const links = getFromStorage<PersonaUseCase>(STORAGE_KEY);
    return links.filter((l) => l.personaId === personaId);
  }

  /**
   * Get all persona-usecase links for a use case
   */
  async listByUseCase(useCaseId: string): Promise<PersonaUseCase[]> {
    await simulateDelay();
    const links = getFromStorage<PersonaUseCase>(STORAGE_KEY);
    return links.filter((l) => l.useCaseId === useCaseId);
  }

  /**
   * Get a single link by ID
   */
  async get(id: string): Promise<PersonaUseCase | null> {
    await simulateDelay();
    const links = getFromStorage<PersonaUseCase>(STORAGE_KEY);
    return links.find((l) => l.id === id) || null;
  }

  /**
   * Check if a link already exists between a persona and use case
   */
  async exists(personaId: string, useCaseId: string): Promise<boolean> {
    const links = getFromStorage<PersonaUseCase>(STORAGE_KEY);
    return links.some((l) => l.personaId === personaId && l.useCaseId === useCaseId);
  }

  /**
   * Create a new persona-usecase link
   */
  async create(data: CreatePersonaUseCaseDto): Promise<PersonaUseCase> {
    await simulateDelay();

    // Check if link already exists
    const existingLinks = getFromStorage<PersonaUseCase>(STORAGE_KEY);
    const alreadyExists = existingLinks.some(
      (l) => l.personaId === data.personaId && l.useCaseId === data.useCaseId
    );

    if (alreadyExists) {
      throw new Error('Link between persona and use case already exists');
    }

    const link: PersonaUseCase = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    };

    existingLinks.push(link);
    saveToStorage(STORAGE_KEY, existingLinks);

    return link;
  }

  /**
   * Delete a link by ID
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const links = getFromStorage<PersonaUseCase>(STORAGE_KEY);
    const filtered = links.filter((l) => l.id !== id);

    if (filtered.length === links.length) {
      return false; // Link not found
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }

  /**
   * Delete all links for a persona
   */
  async deleteByPersonaId(personaId: string): Promise<number> {
    await simulateDelay();

    const links = getFromStorage<PersonaUseCase>(STORAGE_KEY);
    const filtered = links.filter((l) => l.personaId !== personaId);
    const deletedCount = links.length - filtered.length;

    saveToStorage(STORAGE_KEY, filtered);
    return deletedCount;
  }

  /**
   * Delete all links for a use case
   */
  async deleteByUseCaseId(useCaseId: string): Promise<number> {
    await simulateDelay();

    const links = getFromStorage<PersonaUseCase>(STORAGE_KEY);
    const filtered = links.filter((l) => l.useCaseId !== useCaseId);
    const deletedCount = links.length - filtered.length;

    saveToStorage(STORAGE_KEY, filtered);
    return deletedCount;
  }
}

export const personaUseCaseApi = new PersonaUseCaseApi();
