import type { Command } from '../command.types';
import type { Shape, ClassShapeData } from '../../entities/design-studio/types/Shape';
import type { Diagram } from '../../entities/design-studio/types';
import { calculateClassHeight } from '~/design-studio/utils/classHeightCalculator';

export class AddClassMethodCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly method: string,
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
    this.description = `Add class method: "${method}"`;
  }

  async execute(): Promise<void> {
    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as ClassShapeData;
    const methods = currentData.methods || [];

    const newData: ClassShapeData = {
      ...currentData,
      methods: [...methods, this.method],
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
    const methods = currentData.methods || [];

    const newData: ClassShapeData = {
      ...currentData,
      methods: methods.filter((method) => method !== this.method),
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
