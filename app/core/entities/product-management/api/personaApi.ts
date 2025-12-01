import { v4 as uuidv4 } from 'uuid';
import type { Persona, CreatePersonaDto, UpdatePersonaDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'personas';

/**
 * Persona API Client
 * Mock implementation with localStorage persistence
 */
class PersonaApi {
  /**
   * Get all personas for a team
   */
  async list(teamId?: string): Promise<Persona[]> {
    await simulateDelay();
    const personas = getFromStorage<Persona>(STORAGE_KEY);
    if (!teamId) {
      return [];
    }
    return personas.filter((p) => p.teamId === teamId);
  }

  /**
   * Get a single persona by ID
   */
  async get(id: string): Promise<Persona | null> {
    await simulateDelay();
    const personas = getFromStorage<Persona>(STORAGE_KEY);
    return personas.find((p) => p.id === id) || null;
  }

  /**
   * Create a new persona
   */
  async create(data: CreatePersonaDto): Promise<Persona> {
    await simulateDelay();

    const persona: Persona = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const personas = getFromStorage<Persona>(STORAGE_KEY);
    personas.push(persona);
    saveToStorage(STORAGE_KEY, personas);

    return persona;
  }

  /**
   * Update an existing persona
   */
  async update(id: string, updates: Partial<UpdatePersonaDto>): Promise<Persona | null> {
    await simulateDelay();

    const personas = getFromStorage<Persona>(STORAGE_KEY);
    const index = personas.findIndex((p) => p.id === id);

    if (index === -1) {
      return null;
    }

    personas[index] = {
      ...personas[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, personas);
    return personas[index];
  }

  /**
   * Delete a persona
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const personas = getFromStorage<Persona>(STORAGE_KEY);
    const filtered = personas.filter((p) => p.id !== id);

    if (filtered.length === personas.length) {
      return false; // Persona not found
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }
}

export const personaApi = new PersonaApi();
