import type { Command } from '~/core/commands/command.types';
import type { Shape, EnumerationShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Diagram } from '~/core/entities/design-studio/types';

export class UpdateEnumerationLiteralCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly literalIndex: number,
    private readonly oldValue: string,
    private readonly newValue: string,
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
    this.description = `Update enumeration literal: "${oldValue}" → "${newValue}"`;
  }

  async execute(): Promise<void> {
    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as EnumerationShapeData;
    const literals = currentData.literals || [];

    const newLiterals = [...literals];
    newLiterals[this.literalIndex] = this.newValue;

    const newData: EnumerationShapeData = {
      ...currentData,
      literals: newLiterals,
    };

    await this.updateShapeFn(this.diagramId, this.shapeId, {
      data: newData as unknown as Record<string, unknown>,
    });

    this.updateLocalShapeFn?.(this.shapeId, {
      data: newData as unknown as Record<string, unknown>,
    });
  }

  async undo(): Promise<void> {
    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as EnumerationShapeData;
    const literals = currentData.literals || [];

    const newLiterals = [...literals];
    newLiterals[this.literalIndex] = this.oldValue;

    const newData: EnumerationShapeData = {
      ...currentData,
      literals: newLiterals,
    };

    await this.updateShapeFn(this.diagramId, this.shapeId, {
      data: newData as unknown as Record<string, unknown>,
    });

    this.updateLocalShapeFn?.(this.shapeId, {
      data: newData as unknown as Record<string, unknown>,
    });
  }
}
