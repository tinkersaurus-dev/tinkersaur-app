import type { Command } from '../command.types';
import type { Shape } from '../../entities/design-studio/types/Shape';
import type { Diagram } from '../../entities/design-studio/types';

/**
 * Optimized command for moving shapes (position-only updates)
 * More efficient than UpdateShapeCommand for frequent drag operations
 */
export class MoveShapeCommand implements Command {
  public readonly description: string = 'Move shape';

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly fromPosition: { x: number; y: number },
    private readonly toPosition: { x: number; y: number },
    private readonly updateShapeFn: (
      diagramId: string,
      shapeId: string,
      updates: Partial<Shape>
    ) => Promise<Diagram | null>,
    private readonly updateLocalShapeFn?: (
      shapeId: string,
      updates: Partial<Shape>
    ) => void
  ) {}

  async execute(): Promise<void> {
    await this.updateShapeFn(this.diagramId, this.shapeId, {
      x: this.toPosition.x,
      y: this.toPosition.y,
    });

    // Update local canvas state immediately for undo/redo
    this.updateLocalShapeFn?.(this.shapeId, {
      x: this.toPosition.x,
      y: this.toPosition.y,
    });
  }

  async undo(): Promise<void> {
    await this.updateShapeFn(this.diagramId, this.shapeId, {
      x: this.fromPosition.x,
      y: this.fromPosition.y,
    });

    // Update local canvas state immediately for undo/redo
    this.updateLocalShapeFn?.(this.shapeId, {
      x: this.fromPosition.x,
      y: this.fromPosition.y,
    });
  }

  /**
   * Get the distance moved
   */
  getDistance(): { dx: number; dy: number; total: number } {
    const dx = this.toPosition.x - this.fromPosition.x;
    const dy = this.toPosition.y - this.fromPosition.y;
    const total = Math.sqrt(dx * dx + dy * dy);
    return { dx, dy, total };
  }
}
