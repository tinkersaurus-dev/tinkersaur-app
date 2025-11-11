import type { Command } from '../command.types';
import type { Shape } from '../../entities/design-studio/types/Shape';
import type { Connector } from '../../entities/design-studio/types/Connector';
import type { Diagram } from '../../entities/design-studio/types';

/**
 * Command to delete multiple shapes atomically
 * Stores all shape data and connected connectors for restoration on undo
 * All deletions happen as a single atomic operation
 */
export class BatchDeleteShapesCommand implements Command {
  public readonly description: string;
  private deletedShapes: Map<string, Shape> = new Map();
  private deletedConnectors: Connector[] = [];

  constructor(
    private readonly diagramId: string,
    private readonly shapeIds: string[],
    private readonly getShapeFn: (diagramId: string, shapeId: string) => Promise<Shape | null>,
    private readonly deleteShapesBatchFn: (diagramId: string, shapeIds: string[]) => Promise<Diagram | null>,
    private readonly restoreShapesBatchFn: (diagramId: string, shapes: Shape[]) => Promise<Diagram | null>,
    private readonly getDiagramFn: (diagramId: string) => Diagram | null,
    private readonly deleteConnectorsBatchFn: (diagramId: string, connectorIds: string[]) => Promise<Diagram | null>,
    private readonly restoreConnectorsBatchFn: (diagramId: string, connectors: Connector[]) => Promise<Diagram | null>
  ) {
    this.description = shapeIds.length === 1 ? 'Delete shape' : `Delete ${shapeIds.length} shapes`;
  }

  async execute(): Promise<void> {
    // Capture all shapes before deleting
    for (const shapeId of this.shapeIds) {
      const shape = await this.getShapeFn(this.diagramId, shapeId);
      if (shape) {
        this.deletedShapes.set(shapeId, shape);
      }
    }

    // Find all connectors connected to any of the shapes
    const diagram = this.getDiagramFn(this.diagramId);
    if (diagram?.connectors) {
      const shapeIdSet = new Set(this.shapeIds);
      this.deletedConnectors = diagram.connectors.filter(
        (connector) =>
          shapeIdSet.has(connector.sourceShapeId) ||
          shapeIdSet.has(connector.targetShapeId)
      );

      // Delete all connected connectors in a single batch
      if (this.deletedConnectors.length > 0) {
        const connectorIds = this.deletedConnectors.map((c) => c.id);
        await this.deleteConnectorsBatchFn(this.diagramId, connectorIds);
      }
    }

    // Delete all shapes in a single batch operation (atomic state update)
    await this.deleteShapesBatchFn(this.diagramId, this.shapeIds);
  }

  async undo(): Promise<void> {
    if (this.deletedShapes.size === 0) {
      console.warn('Cannot undo BatchDeleteShapesCommand: no shapes were deleted');
      return;
    }

    // Restore all shapes in a single batch operation (atomic state update)
    const shapesToRestore = Array.from(this.deletedShapes.values());
    await this.restoreShapesBatchFn(this.diagramId, shapesToRestore);

    // Then restore all connectors in a single batch
    if (this.deletedConnectors.length > 0) {
      await this.restoreConnectorsBatchFn(this.diagramId, this.deletedConnectors);
    }
  }

  /**
   * Get the deleted shapes data (available after execute)
   */
  getDeletedShapes(): Shape[] {
    return Array.from(this.deletedShapes.values());
  }

  /**
   * Get the deleted connectors data (available after execute)
   */
  getDeletedConnectors(): Connector[] {
    return this.deletedConnectors;
  }
}
