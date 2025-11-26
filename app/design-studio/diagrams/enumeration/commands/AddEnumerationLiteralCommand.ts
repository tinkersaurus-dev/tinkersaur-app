import type { Command } from '~/core/commands/command.types';
import type { Shape, EnumerationShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Diagram } from '~/core/entities/design-studio/types';
import { calculateEnumerationHeight } from '../utils';

export class AddEnumerationLiteralCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly literal: string,
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
    this.description = `Add enumeration literal: "${literal}"`;
  }

  async execute(): Promise<void> {
    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as EnumerationShapeData;
    const literals = currentData.literals || [];

    const newData: EnumerationShapeData = {
      ...currentData,
      literals: [...literals, this.literal],
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
    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as EnumerationShapeData;
    const literals = currentData.literals || [];

    const newData: EnumerationShapeData = {
      ...currentData,
      literals: literals.filter((lit) => lit !== this.literal),
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
