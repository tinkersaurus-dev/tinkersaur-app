import type { Command } from '../command.types';
import type { Shape, ClassShapeData } from '../../entities/design-studio/types/Shape';
import type { Diagram } from '../../entities/design-studio/types';

export class UpdateClassMethodCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly methodIndex: number,
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
    this.description = `Update class method: "${oldValue}" → "${newValue}"`;
  }

  async execute(): Promise<void> {
    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as ClassShapeData;
    const methods = currentData.methods || [];

    const newMethods = [...methods];
    newMethods[this.methodIndex] = this.newValue;

    const newData: ClassShapeData = {
      ...currentData,
      methods: newMethods,
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

    const currentData = (shape.data || {}) as unknown as ClassShapeData;
    const methods = currentData.methods || [];

    const newMethods = [...methods];
    newMethods[this.methodIndex] = this.oldValue;

    const newData: ClassShapeData = {
      ...currentData,
      methods: newMethods,
    };

    await this.updateShapeFn(this.diagramId, this.shapeId, {
      data: newData as unknown as Record<string, unknown>,
    });

    this.updateLocalShapeFn?.(this.shapeId, {
      data: newData as unknown as Record<string, unknown>,
    });
  }
}
