import type { Command } from '../command.types';
import type { Shape, ClassShapeData } from '../../entities/design-studio/types/Shape';
import type { Diagram } from '../../entities/design-studio/types';
import { calculateClassHeight } from '~/design-studio/utils/classHeightCalculator';

export class DeleteClassMethodCommand implements Command {
  public readonly description: string;
  private deletedMethod: string | null = null;
  private deletedIndex: number = -1;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly methodIndex: number,
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
    this.description = `Delete class method at index ${methodIndex}`;
  }

  async execute(): Promise<void> {
    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as ClassShapeData;
    const methods = currentData.methods || [];

    // Store the deleted method for undo
    this.deletedMethod = methods[this.methodIndex];
    this.deletedIndex = this.methodIndex;

    const newData: ClassShapeData = {
      ...currentData,
      methods: methods.filter((_, index) => index !== this.methodIndex),
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
    if (this.deletedMethod === null) return;

    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as ClassShapeData;
    const methods = currentData.methods || [];

    // Restore the method at the original index
    const newMethods = [...methods];
    newMethods.splice(this.deletedIndex, 0, this.deletedMethod);

    const newData: ClassShapeData = {
      ...currentData,
      methods: newMethods,
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
