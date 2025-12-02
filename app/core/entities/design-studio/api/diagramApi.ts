import { v4 as uuidv4 } from 'uuid';
import type { Diagram, CreateDiagramDto, UpdateDiagramDto } from '../types';
import type { CreateShapeDTO, Shape } from '../types/Shape';
import type { CreateConnectorDTO, Connector } from '../types/Connector';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * Diagram API Client
 * Real implementation with backend API
 * Shape and connector operations are done client-side via diagram updates
 */
class DiagramApi {
  /**
   * Get all diagrams for a design work
   */
  async list(designWorkId: string): Promise<Diagram[]> {
    const data = await httpClient.get<Diagram[]>(`/api/diagrams?designWorkId=${designWorkId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get a single diagram by ID
   */
  async get(id: string): Promise<Diagram | null> {
    try {
      const data = await httpClient.get<Diagram>(`/api/diagrams/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new diagram
   */
  async create(data: CreateDiagramDto): Promise<Diagram> {
    const payload = {
      ...data,
      shapes: data.shapes || [],
      connectors: data.connectors || [],
    };
    const result = await httpClient.post<Diagram>('/api/diagrams', payload);
    return deserializeDates(result);
  }

  /**
   * Update an existing diagram
   */
  async update(id: string, updates: Partial<UpdateDiagramDto>): Promise<Diagram | null> {
    try {
      const result = await httpClient.put<Diagram>(`/api/diagrams/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  }

  /**
   * Delete a diagram
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/diagrams/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete all diagrams for a design work
   */
  async deleteByDesignWorkId(designWorkId: string): Promise<number> {
    try {
      const diagrams = await this.list(designWorkId);
      let deletedCount = 0;
      for (const diagram of diagrams) {
        const success = await this.delete(diagram.id);
        if (success) deletedCount++;
      }
      return deletedCount;
    } catch {
      return 0;
    }
  }

  // ============================================
  // Shape manipulation methods
  // These work by fetching the diagram, modifying shapes, and updating
  // ============================================

  /**
   * Add a shape to a diagram
   */
  async addShape(diagramId: string, shapeData: CreateShapeDTO): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const shape: Shape = {
      id: uuidv4(),
      ...shapeData,
      zIndex: shapeData.zIndex ?? 0,
      locked: shapeData.locked ?? false,
    };

    const shapes = [...(diagram.shapes || []), shape];
    return this.update(diagramId, { shapes });
  }

  /**
   * Update a shape in a diagram
   */
  async updateShape(
    diagramId: string,
    shapeId: string,
    updates: Partial<Shape>
  ): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const shapes = (diagram.shapes || []).map((s) =>
      s.id === shapeId ? { ...s, ...updates, id: shapeId } : s
    );

    if (!shapes.some((s) => s.id === shapeId)) {
      return null; // Shape not found
    }

    return this.update(diagramId, { shapes });
  }

  /**
   * Update multiple shapes in a diagram (batch operation)
   */
  async updateShapes(
    diagramId: string,
    updates: Array<{ shapeId: string; updates: Partial<Shape> }>
  ): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const updatesMap = new Map(updates.map((u) => [u.shapeId, u.updates]));
    const shapes = (diagram.shapes || []).map((s) => {
      const shapeUpdates = updatesMap.get(s.id);
      return shapeUpdates ? { ...s, ...shapeUpdates, id: s.id } : s;
    });

    return this.update(diagramId, { shapes });
  }

  /**
   * Delete a shape from a diagram
   */
  async deleteShape(diagramId: string, shapeId: string): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const shapes = (diagram.shapes || []).filter((s) => s.id !== shapeId);
    return this.update(diagramId, { shapes });
  }

  /**
   * Restore a shape with its original ID (used for undo operations)
   */
  async restoreShape(diagramId: string, shape: Shape): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const shapes = [...(diagram.shapes || []), shape];
    return this.update(diagramId, { shapes });
  }

  /**
   * Delete multiple shapes by their IDs in a single operation
   * (Batch operation for atomic delete)
   */
  async deleteShapesByIds(diagramId: string, shapeIds: string[]): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const shapeIdSet = new Set(shapeIds);
    const shapes = (diagram.shapes || []).filter((s) => !shapeIdSet.has(s.id));
    return this.update(diagramId, { shapes });
  }

  /**
   * Restore multiple shapes with their original IDs (used for undo operations)
   * (Batch operation for atomic restore)
   */
  async restoreShapes(diagramId: string, shapes: Shape[]): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const updatedShapes = [...(diagram.shapes || []), ...shapes];
    return this.update(diagramId, { shapes: updatedShapes });
  }

  // ============================================
  // Connector manipulation methods
  // ============================================

  /**
   * Add a connector to a diagram
   */
  async addConnector(diagramId: string, connectorData: CreateConnectorDTO): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const connector: Connector = {
      id: uuidv4(),
      ...connectorData,
      zIndex: connectorData.zIndex ?? 0,
    };

    const connectors = [...(diagram.connectors || []), connector];
    return this.update(diagramId, { connectors });
  }

  /**
   * Update a connector in a diagram
   */
  async updateConnector(
    diagramId: string,
    connectorId: string,
    updates: Partial<Connector>
  ): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const connectors = (diagram.connectors || []).map((c) =>
      c.id === connectorId ? { ...c, ...updates, id: connectorId } : c
    );

    if (!connectors.some((c) => c.id === connectorId)) {
      return null; // Connector not found
    }

    return this.update(diagramId, { connectors });
  }

  /**
   * Delete a connector from a diagram
   */
  async deleteConnector(diagramId: string, connectorId: string): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const connectors = (diagram.connectors || []).filter((c) => c.id !== connectorId);
    return this.update(diagramId, { connectors });
  }

  /**
   * Restore a connector with its original ID (used for undo operations)
   */
  async restoreConnector(diagramId: string, connector: Connector): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const connectors = [...(diagram.connectors || []), connector];
    return this.update(diagramId, { connectors });
  }

  /**
   * Delete connectors connected to a specific shape (used when deleting shapes)
   */
  async deleteConnectorsByShapeId(diagramId: string, shapeId: string): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const connectors = (diagram.connectors || []).filter(
      (c) => c.sourceShapeId !== shapeId && c.targetShapeId !== shapeId
    );
    return this.update(diagramId, { connectors });
  }

  /**
   * Delete multiple connectors by their IDs in a single operation
   * Used for batch deletion to ensure atomic operations
   */
  async deleteConnectorsByIds(diagramId: string, connectorIds: string[]): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const connectorIdSet = new Set(connectorIds);
    const connectors = (diagram.connectors || []).filter((c) => !connectorIdSet.has(c.id));
    return this.update(diagramId, { connectors });
  }

  /**
   * Restore multiple connectors at once in a single operation
   * Used for batch restore to ensure atomic operations during undo
   */
  async restoreConnectors(diagramId: string, connectors: Connector[]): Promise<Diagram | null> {
    const diagram = await this.get(diagramId);
    if (!diagram) return null;

    const updatedConnectors = [...(diagram.connectors || []), ...connectors];
    return this.update(diagramId, { connectors: updatedConnectors });
  }
}

export const diagramApi = new DiagramApi();
