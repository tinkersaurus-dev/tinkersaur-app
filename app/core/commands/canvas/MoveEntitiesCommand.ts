import type { Command } from '../command.types';
import type { Shape } from '../../entities/design-studio/types/Shape';
import type { Diagram } from '../../entities/design-studio/types';

/**
 * Command for moving multiple shapes together as a single atomic operation
 * Makes one batched API call and one state update for all shape moves
 */
export class MoveEntitiesCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly diagramId: string,
    private readonly moves: Array<{
      shapeId: string;
      fromPosition: { x: number; y: number };
      toPosition: { x: number; y: number };
    }>,
    private readonly updateShapesFn: (
      diagramId: string,
      updates: Array<{ shapeId: string; updates: Partial<Shape> }>
    ) => Promise<Diagram | null>,
    private readonly updateLocalShapeFn?: (
      shapeId: string,
      updates: Partial<Shape>
    ) => void
  ) {
    this.description =
      moves.length === 1 ? 'Move shape' : `Move ${moves.length} shapes`;
  }

  async execute(): Promise<void> {
    // Build batch update array with toPositions
    const updates = this.moves.map((move) => ({
      shapeId: move.shapeId,
      updates: {
        x: move.toPosition.x,
        y: move.toPosition.y,
      },
    }));

    // Single batched API call and state update
    await this.updateShapesFn(this.diagramId, updates);

    // Update local canvas state for each shape
    if (this.updateLocalShapeFn) {
      this.moves.forEach((move) => {
        this.updateLocalShapeFn!(move.shapeId, {
          x: move.toPosition.x,
          y: move.toPosition.y,
        });
      });
    }
  }

  async undo(): Promise<void> {
    // Build batch update array with fromPositions
    const updates = this.moves.map((move) => ({
      shapeId: move.shapeId,
      updates: {
        x: move.fromPosition.x,
        y: move.fromPosition.y,
      },
    }));

    // Single batched API call and state update
    await this.updateShapesFn(this.diagramId, updates);

    // Update local canvas state for each shape
    if (this.updateLocalShapeFn) {
      this.moves.forEach((move) => {
        this.updateLocalShapeFn!(move.shapeId, {
          x: move.fromPosition.x,
          y: move.fromPosition.y,
        });
      });
    }
  }
}
