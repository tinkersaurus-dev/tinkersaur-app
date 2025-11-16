import type { Command } from '../command.types';
import type { Shape } from '../../entities/design-studio/types/Shape';
import type { Diagram } from '../../entities/design-studio/types';
import { isLLMPreviewShapeData } from '../../entities/design-studio/types/Shape';

/**
 * Command for moving multiple shapes together as a single atomic operation
 * Makes one batched API call and one state update for all shape moves
 * Automatically cascades moves to preview shapes when a preview container is moved
 */
export class MoveEntitiesCommand implements Command {
  public readonly description: string;
  private allMoves: Array<{
    shapeId: string;
    fromPosition: { x: number; y: number };
    toPosition: { x: number; y: number };
  }> = [];

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
    private readonly getDiagramFn: (diagramId: string) => Diagram | null,
    private readonly updateLocalShapeFn?: (
      shapeId: string,
      updates: Partial<Shape>
    ) => void
  ) {
    this.description =
      moves.length === 1 ? 'Move shape' : `Move ${moves.length} shapes`;
  }

  async execute(): Promise<void> {
    const diagram = this.getDiagramFn(this.diagramId);
    if (!diagram) {
      throw new Error(`Diagram ${this.diagramId} not found`);
    }

    // Build the complete list of moves, including preview shapes
    this.allMoves = [...this.moves];

    // For each moved shape, check if it's a preview container
    for (const move of this.moves) {
      const shape = diagram.shapes.find((s) => s.id === move.shapeId);

      if (shape?.type === 'llm-preview' && isLLMPreviewShapeData(shape.data)) {
        const previewData = shape.data;
        const deltaX = move.toPosition.x - move.fromPosition.x;
        const deltaY = move.toPosition.y - move.fromPosition.y;

        // Add moves for all preview shapes
        for (const previewShapeId of previewData.previewShapeIds) {
          const previewShape = diagram.shapes.find((s) => s.id === previewShapeId);
          if (previewShape) {
            this.allMoves.push({
              shapeId: previewShapeId,
              fromPosition: { x: previewShape.x, y: previewShape.y },
              toPosition: {
                x: previewShape.x + deltaX,
                y: previewShape.y + deltaY,
              },
            });
          }
        }
      }
    }

    // Build batch update array with toPositions
    const updates = this.allMoves.map((move) => ({
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
      this.allMoves.forEach((move) => {
        this.updateLocalShapeFn!(move.shapeId, {
          x: move.toPosition.x,
          y: move.toPosition.y,
        });
      });
    }
  }

  async undo(): Promise<void> {
    // Build batch update array with fromPositions (includes preview shapes if any)
    const updates = this.allMoves.map((move) => ({
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
      this.allMoves.forEach((move) => {
        this.updateLocalShapeFn!(move.shapeId, {
          x: move.fromPosition.x,
          y: move.fromPosition.y,
        });
      });
    }
  }
}
