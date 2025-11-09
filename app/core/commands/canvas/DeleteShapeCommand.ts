import type { Command } from '../command.types';
import type { Shape } from '../../entities/design-studio/types/Shape';
import type { Connector } from '../../entities/design-studio/types/Connector';
import type { Diagram } from '../../entities/design-studio/types';

/**
 * Command to delete a shape from a diagram
 * Stores the complete shape data and any connected connectors for restoration on undo
 * Automatically cascades deletion to orphaned connectors in a single atomic operation
 */
export class DeleteShapeCommand implements Command {
  public readonly description: string;
  private deletedShape: Shape | null = null;
  private deletedConnectors: Connector[] = [];

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly getShapeFn: (diagramId: string, shapeId: string) => Promise<Shape | null>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly restoreShapeFn: (diagramId: string, shape: Shape) => Promise<Diagram>,
    private readonly getDiagramFn: (diagramId: string) => Diagram | null,
    private readonly deleteConnectorsBatchFn: (diagramId: string, connectorIds: string[]) => Promise<Diagram | null>,
    private readonly restoreConnectorsBatchFn: (diagramId: string, connectors: Connector[]) => Promise<Diagram | null>
  ) {
    this.description = 'Delete shape';
  }

  async execute(): Promise<void> {
    // Capture the shape before deleting
    this.deletedShape = await this.getShapeFn(this.diagramId, this.shapeId);

    if (!this.deletedShape) {
      console.warn(`Cannot delete shape: shape ${this.shapeId} not found`);
      return;
    }

    // Find and capture all connectors connected to this shape
    const diagram = this.getDiagramFn(this.diagramId);
    if (diagram?.connectors) {
      this.deletedConnectors = diagram.connectors.filter(
        (connector) =>
          connector.sourceShapeId === this.shapeId ||
          connector.targetShapeId === this.shapeId
      );

      // Delete all connected connectors in a single atomic operation
      if (this.deletedConnectors.length > 0) {
        const connectorIds = this.deletedConnectors.map((c) => c.id);
        await this.deleteConnectorsBatchFn(this.diagramId, connectorIds);
      }
    }

    // Now delete the shape
    await this.deleteShapeFn(this.diagramId, this.shapeId);
  }

  async undo(): Promise<void> {
    if (!this.deletedShape) {
      console.warn('Cannot undo DeleteShapeCommand: deleted shape not found');
      return;
    }

    // Restore the shape first with its original ID and all properties preserved
    await this.restoreShapeFn(this.diagramId, this.deletedShape);

    // Then restore all the connectors in a single atomic operation
    if (this.deletedConnectors.length > 0) {
      await this.restoreConnectorsBatchFn(this.diagramId, this.deletedConnectors);
    }
  }

  /**
   * Get the deleted shape data (available after execute)
   */
  getDeletedShape(): Shape | null {
    return this.deletedShape;
  }
}
