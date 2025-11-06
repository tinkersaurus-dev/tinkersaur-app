import { v4 as uuidv4 } from 'uuid';
import type { Diagram, CreateDiagramDto, UpdateDiagramDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'diagrams';

class DiagramApi {
  /**
   * Get all diagrams for a design work
   */
  async list(designWorkId: string): Promise<Diagram[]> {
    await simulateDelay();
    const diagrams = getFromStorage<Diagram>(STORAGE_KEY);
    return diagrams.filter((d) => d.designWorkId === designWorkId);
  }

  /**
   * Get all diagrams
   */
  async listAll(): Promise<Diagram[]> {
    await simulateDelay();
    return getFromStorage<Diagram>(STORAGE_KEY);
  }

  /**
   * Get a single diagram by ID
   */
  async get(id: string): Promise<Diagram | null> {
    await simulateDelay();
    const diagrams = getFromStorage<Diagram>(STORAGE_KEY);
    return diagrams.find((d) => d.id === id) || null;
  }

  /**
   * Create a new diagram
   */
  async create(data: CreateDiagramDto): Promise<Diagram> {
    await simulateDelay();

    const diagram: Diagram = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const diagrams = getFromStorage<Diagram>(STORAGE_KEY);
    diagrams.push(diagram);
    saveToStorage(STORAGE_KEY, diagrams);

    return diagram;
  }

  /**
   * Update an existing diagram
   */
  async update(id: string, updates: Partial<UpdateDiagramDto>): Promise<Diagram | null> {
    await simulateDelay();

    const diagrams = getFromStorage<Diagram>(STORAGE_KEY);
    const index = diagrams.findIndex((d) => d.id === id);

    if (index === -1) {
      return null;
    }

    diagrams[index] = {
      ...diagrams[index],
      ...updates,
      id,
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, diagrams);
    return diagrams[index];
  }

  /**
   * Delete a diagram
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const diagrams = getFromStorage<Diagram>(STORAGE_KEY);
    const filtered = diagrams.filter((d) => d.id !== id);

    if (filtered.length === diagrams.length) {
      return false;
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }

  /**
   * Delete all diagrams for a design work
   */
  async deleteByDesignWorkId(designWorkId: string): Promise<number> {
    await simulateDelay();

    const diagrams = getFromStorage<Diagram>(STORAGE_KEY);
    const filtered = diagrams.filter((d) => d.designWorkId !== designWorkId);
    const deletedCount = diagrams.length - filtered.length;

    saveToStorage(STORAGE_KEY, filtered);
    return deletedCount;
  }
}

export const diagramApi = new DiagramApi();
