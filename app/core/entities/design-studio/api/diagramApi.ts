import { v4 as uuidv4 } from 'uuid';
import type { Diagram, CreateDiagramDto, UpdateDiagramDto } from '../types';
import type { CreateShapeDTO, Shape } from '../types/Shape';
import { getDiagramsFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'diagrams';

class DiagramApi {
  /**
   * Get all diagrams for a design work
   */
  async list(designWorkId: string): Promise<Diagram[]> {
    await simulateDelay();
    const diagrams = getDiagramsFromStorage();
    return diagrams.filter((d: Diagram) => d.designWorkId === designWorkId);
  }

  /**
   * Get a single diagram by ID
   */
  async get(id: string): Promise<Diagram | null> {
    await simulateDelay();
    const diagrams = getDiagramsFromStorage();
    return diagrams.find((d: Diagram) => d.id === id) || null;
  }

  /**
   * Create a new diagram
   */
  async create(data: CreateDiagramDto): Promise<Diagram> {
    await simulateDelay();

    const diagram: Diagram = {
      ...data,
      id: uuidv4(),
      // Initialize content arrays if not provided
      shapes: data.shapes || [],
      connectors: data.connectors || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const diagrams = getDiagramsFromStorage();
    diagrams.push(diagram);
    saveToStorage(STORAGE_KEY, diagrams);

    return diagram;
  }

  /**
   * Update an existing diagram
   */
  async update(id: string, updates: Partial<UpdateDiagramDto>): Promise<Diagram | null> {
    await simulateDelay();

    const diagrams = getDiagramsFromStorage();
    const index = diagrams.findIndex((d: Diagram) => d.id === id);

    if (index === -1) {
      return null;
    }

    const currentDiagram = diagrams[index];

    diagrams[index] = {
      ...currentDiagram,
      ...updates,
      id,
      // Explicitly preserve critical arrays if not in updates
      shapes: updates.shapes ?? currentDiagram.shapes ?? [],
      connectors: updates.connectors ?? currentDiagram.connectors ?? [],
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

    const diagrams = getDiagramsFromStorage();
    const filtered = diagrams.filter((d: Diagram) => d.id !== id);

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

    const diagrams = getDiagramsFromStorage();
    const filtered = diagrams.filter((d: Diagram) => d.designWorkId !== designWorkId);
    const deletedCount = diagrams.length - filtered.length;

    saveToStorage(STORAGE_KEY, filtered);
    return deletedCount;
  }

  // ============================================
  // Shape manipulation methods
  // ============================================

  /**
   * Add a shape to a diagram
   */
  async addShape(diagramId: string, shapeData: CreateShapeDTO): Promise<Diagram | null> {
    await simulateDelay();



    const diagrams = getDiagramsFromStorage();
    const index = diagrams.findIndex((d: Diagram) => d.id === diagramId);

    if (index === -1) {
      return null;
    }

    const shape: Shape = {
      id: uuidv4(),
      ...shapeData,
      zIndex: shapeData.zIndex ?? 0,
      locked: shapeData.locked ?? false,
    };


    // Defensive: Initialize shapes array if undefined (handles corrupted data)
    if (!diagrams[index].shapes) {
      diagrams[index].shapes = [];
    }

    diagrams[index].shapes.push(shape);
    diagrams[index].updatedAt = new Date();

    saveToStorage(STORAGE_KEY, diagrams);
    return diagrams[index];
  }

  /**
   * Update a shape in a diagram
   */
  async updateShape(
    diagramId: string,
    shapeId: string,
    updates: Partial<Shape>
  ): Promise<Diagram | null> {
    await simulateDelay();

    const diagrams = getDiagramsFromStorage();
    const diagramIndex = diagrams.findIndex((d: Diagram) => d.id === diagramId);

    if (diagramIndex === -1) {
      return null;
    }

    // Defensive: Initialize shapes array if undefined (handles corrupted data)
    if (!diagrams[diagramIndex].shapes) {
      diagrams[diagramIndex].shapes = [];
    }

    const shapeIndex = diagrams[diagramIndex].shapes.findIndex((s: Shape) => s.id === shapeId);

    if (shapeIndex === -1) {
      return null;
    }

    diagrams[diagramIndex].shapes[shapeIndex] = {
      ...diagrams[diagramIndex].shapes[shapeIndex],
      ...updates,
      id: shapeId, // Ensure ID doesn't change
    };

    diagrams[diagramIndex].updatedAt = new Date();

    saveToStorage(STORAGE_KEY, diagrams);
    return diagrams[diagramIndex];
  }

  /**
   * Update multiple shapes in a diagram (batch operation)
   */
  async updateShapes(
    diagramId: string,
    updates: Array<{ shapeId: string; updates: Partial<Shape> }>
  ): Promise<Diagram | null> {
    await simulateDelay();

    const diagrams = getDiagramsFromStorage();
    const diagramIndex = diagrams.findIndex((d: Diagram) => d.id === diagramId);

    if (diagramIndex === -1) {
      return null;
    }

    // Defensive: Initialize shapes array if undefined
    if (!diagrams[diagramIndex].shapes) {
      diagrams[diagramIndex].shapes = [];
    }

    // Apply all updates in a single transaction
    updates.forEach(({ shapeId, updates: shapeUpdates }) => {
      const shapeIndex = diagrams[diagramIndex].shapes.findIndex((s: Shape) => s.id === shapeId);

      if (shapeIndex !== -1) {
        diagrams[diagramIndex].shapes[shapeIndex] = {
          ...diagrams[diagramIndex].shapes[shapeIndex],
          ...shapeUpdates,
          id: shapeId, // Ensure ID doesn't change
        };
      }
    });

    diagrams[diagramIndex].updatedAt = new Date();

    saveToStorage(STORAGE_KEY, diagrams);
    return diagrams[diagramIndex];
  }

  /**
   * Delete a shape from a diagram
   */
  async deleteShape(diagramId: string, shapeId: string): Promise<Diagram | null> {
    await simulateDelay();

    const diagrams = getDiagramsFromStorage();
    const index = diagrams.findIndex((d: Diagram) => d.id === diagramId);

    if (index === -1) {
      return null;
    }

    // Defensive: Initialize shapes array if undefined (handles corrupted data)
    if (!diagrams[index].shapes) {
      diagrams[index].shapes = [];
    }

    diagrams[index].shapes = diagrams[index].shapes.filter((s: Shape) => s.id !== shapeId);
    diagrams[index].updatedAt = new Date();

    saveToStorage(STORAGE_KEY, diagrams);
    return diagrams[index];
  }

  /**
   * Restore a shape with its original ID (used for undo operations)
   */
  async restoreShape(diagramId: string, shape: Shape): Promise<Diagram | null> {
    await simulateDelay();

    const diagrams = getDiagramsFromStorage();
    const index = diagrams.findIndex((d: Diagram) => d.id === diagramId);

    if (index === -1) {
      return null;
    }

    // Defensive: Initialize shapes array if undefined (handles corrupted data)
    if (!diagrams[index].shapes) {
      diagrams[index].shapes = [];
    }

    // Add the shape with its preserved ID
    diagrams[index].shapes.push(shape);
    diagrams[index].updatedAt = new Date();

    saveToStorage(STORAGE_KEY, diagrams);
    return diagrams[index];
  }

}

export const diagramApi = new DiagramApi();
