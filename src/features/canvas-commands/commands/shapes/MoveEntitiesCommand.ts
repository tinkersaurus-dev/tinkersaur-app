import type { Command } from '../../model/command.types';
import type { Shape } from '@/entities/shape';
import type { Diagram } from '@/entities/diagram';
import { isLLMPreviewShapeData } from '@/entities/shape';
import { getAllDescendantIds } from '@/widgets/canvas/lib/utils/containment-utils';

/**
 * Command for moving multiple shapes together as a single atomic operation
 * Makes one batched API call and one state update for all shape moves
 * Automatically cascades moves to:
 * - Children when a parent container is moved (via parentId field)
 * - Preview shapes when a preview container is moved (legacy support)
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

    // Build the complete list of moves, including descendants
    this.allMoves = [...this.moves];

    // Track which shapes we've already added to avoid duplicates
    const processedShapeIds = new Set(this.moves.map(m => m.shapeId));

    // For each moved shape, check for cascade requirements
    for (const move of this.moves) {
      const shape = diagram.shapes.find((s) => s.id === move.shapeId);
      if (!shape) continue;

      const deltaX = move.toPosition.x - move.fromPosition.x;
      const deltaY = move.toPosition.y - move.fromPosition.y;

      // 1. Handle parent-child relationships (generic containers)
      if (shape.children && shape.children.length > 0) {
        const descendantIds = getAllDescendantIds(shape.id, diagram.shapes);

        for (const descendantId of descendantIds) {
          if (processedShapeIds.has(descendantId)) continue;

          const descendantShape = diagram.shapes.find((s) => s.id === descendantId);
          if (descendantShape) {
            this.allMoves.push({
              shapeId: descendantId,
              fromPosition: { x: descendantShape.x, y: descendantShape.y },
              toPosition: {
                x: descendantShape.x + deltaX,
                y: descendantShape.y + deltaY,
              },
            });
            processedShapeIds.add(descendantId);
          }
        }
      }

      // 2. Handle LLM preview containers (legacy support)
      if (shape.type === 'llm-preview' && isLLMPreviewShapeData(shape.data)) {
        const previewData = shape.data;

        for (const previewShapeId of previewData.previewShapeIds) {
          if (processedShapeIds.has(previewShapeId)) continue;

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
            processedShapeIds.add(previewShapeId);
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
