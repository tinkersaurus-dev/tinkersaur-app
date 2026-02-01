import type { Command } from '../../model/command.types';
import type { Shape } from '@/entities/shape';
import type { Diagram } from '@/entities/diagram';
import type { Bounds } from '@/widgets/canvas/lib/utils/resize';

/**
 * Shape bounds update for resize operations
 */
export interface ShapeBoundsUpdate {
  shapeId: string;
  fromBounds: Bounds;
  toBounds: Bounds;
}

/**
 * Command for resizing one or more shapes
 * Supports undo/redo by tracking original and new bounds for each shape
 */
export class ResizeShapesCommand implements Command {
  public readonly description: string = 'Resize shapes';

  constructor(
    private readonly diagramId: string,
    private readonly shapeUpdates: ShapeBoundsUpdate[],
    private readonly updateShapesFn: (
      diagramId: string,
      updates: Array<{ shapeId: string; updates: Partial<Shape> }>
    ) => Promise<Diagram | null>,
    private readonly updateLocalShapeFn?: (shapeId: string, updates: Partial<Shape>) => void
  ) {}

  async execute(): Promise<void> {
    // Apply the new bounds to all shapes
    const updates = this.shapeUpdates.map(({ shapeId, toBounds }) => ({
      shapeId,
      updates: {
        x: toBounds.x,
        y: toBounds.y,
        width: toBounds.width,
        height: toBounds.height,
      },
    }));

    await this.updateShapesFn(this.diagramId, updates);

    // Update local canvas state immediately for undo/redo visual feedback
    if (this.updateLocalShapeFn) {
      for (const { shapeId, toBounds } of this.shapeUpdates) {
        this.updateLocalShapeFn(shapeId, {
          x: toBounds.x,
          y: toBounds.y,
          width: toBounds.width,
          height: toBounds.height,
        });
      }
    }
  }

  async undo(): Promise<void> {
    // Restore the original bounds for all shapes
    const updates = this.shapeUpdates.map(({ shapeId, fromBounds }) => ({
      shapeId,
      updates: {
        x: fromBounds.x,
        y: fromBounds.y,
        width: fromBounds.width,
        height: fromBounds.height,
      },
    }));

    await this.updateShapesFn(this.diagramId, updates);

    // Update local canvas state immediately for undo/redo visual feedback
    if (this.updateLocalShapeFn) {
      for (const { shapeId, fromBounds } of this.shapeUpdates) {
        this.updateLocalShapeFn(shapeId, {
          x: fromBounds.x,
          y: fromBounds.y,
          width: fromBounds.width,
          height: fromBounds.height,
        });
      }
    }
  }
}
