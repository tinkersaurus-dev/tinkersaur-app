import type { Command } from '../../command.types';
import type { Shape } from '../../../entities/design-studio/types/Shape';
import type { Connector } from '../../../entities/design-studio/types/Connector';
import type { Diagram } from '../../../entities/design-studio/types';
import { isLLMPreviewShapeData } from '../../../entities/design-studio/types/Shape';

/**
 * Command to delete a shape from a diagram
 * Stores the complete shape data and any connected connectors for restoration on undo
 * Automatically cascades deletion to orphaned connectors in a single atomic operation
 * For preview container shapes, also cascades deletion to all preview shapes and connectors
 */
export class DeleteShapeCommand implements Command {
  public readonly description: string;
  private deletedShape: Shape | null = null;
  private deletedConnectors: Connector[] = [];
  private deletedPreviewShapes: Shape[] = [];
  private deletedPreviewConnectors: Connector[] = [];

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly getShapeFn: (diagramId: string, shapeId: string) => Promise<Shape | null>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly restoreShapeFn: (diagramId: string, shape: Shape) => Promise<Diagram>,
    private readonly getDiagramFn: (diagramId: string) => Diagram | null,
    private readonly deleteConnectorsBatchFn: (diagramId: string, connectorIds: string[]) => Promise<Diagram | null>,
    private readonly restoreConnectorsBatchFn: (diagramId: string, connectors: Connector[]) => Promise<Diagram | null>,
    private readonly deleteShapesBatchFn?: (diagramId: string, shapeIds: string[]) => Promise<Diagram | null>,
    private readonly restoreShapesBatchFn?: (diagramId: string, shapes: Shape[]) => Promise<Diagram | null>
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

    const diagram = this.getDiagramFn(this.diagramId);

    // If this is a preview container shape, cascade delete all preview shapes and connectors
    if (this.deletedShape.type === 'llm-preview' && isLLMPreviewShapeData(this.deletedShape.data)) {
      const previewData = this.deletedShape.data;

      // Capture all preview connectors before deletion
      if (diagram?.connectors && previewData.previewConnectorIds.length > 0) {
        this.deletedPreviewConnectors = diagram.connectors.filter((connector) =>
          previewData.previewConnectorIds.includes(connector.id)
        );

        // Delete preview connectors in batch
        if (this.deletedPreviewConnectors.length > 0) {
          await this.deleteConnectorsBatchFn(this.diagramId, previewData.previewConnectorIds);
        }
      }

      // Capture all preview shapes before deletion
      if (diagram?.shapes && previewData.previewShapeIds.length > 0) {
        this.deletedPreviewShapes = diagram.shapes.filter((shape) =>
          previewData.previewShapeIds.includes(shape.id)
        );

        // Delete preview shapes in batch
        if (this.deletedPreviewShapes.length > 0 && this.deleteShapesBatchFn) {
          await this.deleteShapesBatchFn(this.diagramId, previewData.previewShapeIds);
        } else {
          // Fallback to one-by-one deletion if batch function not available
          for (const shapeId of previewData.previewShapeIds) {
            await this.deleteShapeFn(this.diagramId, shapeId);
          }
        }
      }
    }

    // Find and capture all connectors connected to this shape
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

    // Restore preview shapes first (if this was a preview container)
    if (this.deletedPreviewShapes.length > 0) {
      if (this.restoreShapesBatchFn) {
        await this.restoreShapesBatchFn(this.diagramId, this.deletedPreviewShapes);
      } else {
        // Fallback to one-by-one restoration
        for (const shape of this.deletedPreviewShapes) {
          await this.restoreShapeFn(this.diagramId, shape);
        }
      }
    }

    // Then restore preview connectors (if this was a preview container)
    if (this.deletedPreviewConnectors.length > 0) {
      await this.restoreConnectorsBatchFn(this.diagramId, this.deletedPreviewConnectors);
    }

    // Restore the shape itself with its original ID and all properties preserved
    await this.restoreShapeFn(this.diagramId, this.deletedShape);

    // Finally restore all the connectors connected to this shape in a single atomic operation
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
