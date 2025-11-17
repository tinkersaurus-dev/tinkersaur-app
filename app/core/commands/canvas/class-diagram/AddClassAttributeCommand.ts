import type { Command } from '../../command.types';
import type { Shape, ClassShapeData } from '../../../entities/design-studio/types/Shape';
import type { Diagram } from '../../../entities/design-studio/types';
import { calculateClassHeight } from '~/design-studio/utils/classHeightCalculator';

export class AddClassAttributeCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly attribute: string,
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
    this.description = `Add class attribute: "${attribute}"`;
  }

  async execute(): Promise<void> {
    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as ClassShapeData;
    const attributes = currentData.attributes || [];

    const newData: ClassShapeData = {
      ...currentData,
      attributes: [...attributes, this.attribute],
    };

    const newHeight = calculateClassHeight(newData);

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

    const currentData = (shape.data || {}) as unknown as ClassShapeData;
    const attributes = currentData.attributes || [];

    const newData: ClassShapeData = {
      ...currentData,
      attributes: attributes.filter((attr) => attr !== this.attribute),
    };

    const newHeight = calculateClassHeight(newData);

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
