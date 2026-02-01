import type { Command } from '../../model/command.types';
import type { Shape } from '@/entities/shape';
import type { Connector } from '@/entities/connector';
import type { Diagram } from '@/entities/diagram';
import { isLLMPreviewShapeData } from '@/entities/shape';
import { getAllDescendantIds } from '~/design-studio/utils/containment-utils';

/**
 * Command to delete a shape from a diagram
 * Stores the complete shape data and any connected connectors for restoration on undo
 * Automatically cascades deletion to orphaned connectors in a single atomic operation
 * For preview container shapes, also cascades deletion to all preview shapes and connectors
 * For container shapes with children, also cascades deletion to all child shapes and their connectors
 */
export class DeleteShapeCommand implements Command {
  public readonly description: string;
  private deletedShape: Shape | null = null;
  private deletedConnectors: Connector[] = [];
  private deletedPreviewShapes: Shape[] = [];
  private deletedPreviewConnectors: Connector[] = [];
  private deletedChildShapes: Shape[] = [];
  private deletedChildConnectors: Connector[] = [];

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

    // 1. If this is a preview container shape, cascade delete all preview shapes and connectors
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

    // 2. If this shape has children (parent-child relationships), cascade delete all descendants
    if (diagram?.shapes && this.deletedShape.children && this.deletedShape.children.length > 0) {
      // Collect all descendants recursively
      const descendantIds = getAllDescendantIds(this.deletedShape.id, diagram.shapes);

      if (descendantIds.size > 0) {
        // Capture all child shapes before deletion
        this.deletedChildShapes = diagram.shapes.filter((shape) =>
          descendantIds.has(shape.id)
        );

        // Capture all connectors connected to any child shape
        if (diagram.connectors) {
          this.deletedChildConnectors = diagram.connectors.filter((connector) =>
            Array.from(descendantIds).some(
              (childId) =>
                connector.sourceShapeId === childId || connector.targetShapeId === childId
            )
          );

          // Delete child connectors in batch
          if (this.deletedChildConnectors.length > 0) {
            const connectorIds = this.deletedChildConnectors.map((c) => c.id);
            await this.deleteConnectorsBatchFn(this.diagramId, connectorIds);
          }
        }

        // Delete child shapes in batch
        if (this.deletedChildShapes.length > 0 && this.deleteShapesBatchFn) {
          await this.deleteShapesBatchFn(this.diagramId, Array.from(descendantIds));
        } else {
          // Fallback to one-by-one deletion if batch function not available
          for (const childId of descendantIds) {
            await this.deleteShapeFn(this.diagramId, childId);
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

    // Restore child shapes first (if this was a container with children)
    if (this.deletedChildShapes.length > 0) {
      if (this.restoreShapesBatchFn) {
        await this.restoreShapesBatchFn(this.diagramId, this.deletedChildShapes);
      } else {
        // Fallback to one-by-one restoration
        for (const shape of this.deletedChildShapes) {
          await this.restoreShapeFn(this.diagramId, shape);
        }
      }
    }

    // Then restore child connectors (if this was a container with children)
    if (this.deletedChildConnectors.length > 0) {
      await this.restoreConnectorsBatchFn(this.diagramId, this.deletedChildConnectors);
    }

    // Restore preview shapes (if this was a preview container)
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
