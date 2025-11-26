import type { Command } from '~/core/commands/command.types';
import type { Shape, EnumerationShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Diagram } from '~/core/entities/design-studio/types';
import { calculateEnumerationHeight } from '../utils';

export class DeleteEnumerationLiteralCommand implements Command {
  public readonly description: string;
  private deletedLiteral: string | null = null;
  private deletedIndex: number = -1;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly literalIndex: number,
    private readonly updateShapeFn: (
      diagramId: string,
      shapeId: string,
      updates: Partial<Shape>
    ) => Promise<Diagram | null>,
    private readonly getShapeFn: (shapeId: string) => Shape | undefined,
    private readonly updateLocalShapeFn?: (
      shapeId: string,
      updates: Partial<Shape>
    ) => void
  ) {
    this.description = `Delete enumeration literal at index ${literalIndex}`;
  }

  async execute(): Promise<void> {
    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as EnumerationShapeData;
    const literals = currentData.literals || [];

    // Store the deleted literal for undo
    this.deletedLiteral = literals[this.literalIndex];
    this.deletedIndex = this.literalIndex;

    const newData: EnumerationShapeData = {
      ...currentData,
      literals: literals.filter((_, index) => index !== this.literalIndex),
    };

    const newHeight = calculateEnumerationHeight(newData);

    await this.updateShapeFn(this.diagramId, this.shapeId, {
      data: newData as unknown as Record<string, unknown>,
      height: newHeight,
    });

    this.updateLocalShapeFn?.(this.shapeId, {
      data: newData as unknown as Record<string, unknown>,
      height: newHeight,
    });
  }

  async undo(): Promise<void> {
    if (this.deletedLiteral === null) return;

    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as EnumerationShapeData;
    const literals = currentData.literals || [];

    // Restore the literal at the original index
    const newLiterals = [...literals];
    newLiterals.splice(this.deletedIndex, 0, this.deletedLiteral);

    const newData: EnumerationShapeData = {
      ...currentData,
      literals: newLiterals,
    };

    const newHeight = calculateEnumerationHeight(newData);

    await this.updateShapeFn(this.diagramId, this.shapeId, {
      data: newData as unknown as Record<string, unknown>,
      height: newHeight,
    });

    this.updateLocalShapeFn?.(this.shapeId, {
      data: newData as unknown as Record<string, unknown>,
      height: newHeight,
    });
  }
}
