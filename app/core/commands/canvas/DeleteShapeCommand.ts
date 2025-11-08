import type { Command } from '../command.types';
import type { Shape } from '../../entities/design-studio/types/Shape';
import type { Diagram } from '../../entities/design-studio/types';

/**
 * Command to delete a shape from a diagram
 * Stores the complete shape data for restoration on undo
 */
export class DeleteShapeCommand implements Command {
  public readonly description: string;
  private deletedShape: Shape | null = null;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly getShapeFn: (diagramId: string, shapeId: string) => Promise<Shape | null>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly restoreShapeFn: (diagramId: string, shape: Shape) => Promise<Diagram>
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

    await this.deleteShapeFn(this.diagramId, this.shapeId);
  }

  async undo(): Promise<void> {
    if (!this.deletedShape) {
      console.warn('Cannot undo DeleteShapeCommand: deleted shape not found');
      return;
    }

    // Restore the shape with its original ID and all properties preserved
    await this.restoreShapeFn(this.diagramId, this.deletedShape);
  }

  /**
   * Get the deleted shape data (available after execute)
   */
  getDeletedShape(): Shape | null {
    return this.deletedShape;
  }
}
