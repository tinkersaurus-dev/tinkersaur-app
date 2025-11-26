import type { Command } from '~/core/commands/command.types';
import type { Shape, ClassShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Diagram } from '~/core/entities/design-studio/types';
import { calculateClassHeight } from '../utils';

export class DeleteClassAttributeCommand implements Command {
  public readonly description: string;
  private deletedAttribute: string | null = null;
  private deletedIndex: number = -1;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly attributeIndex: number,
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
    this.description = `Delete class attribute at index ${attributeIndex}`;
  }

  async execute(): Promise<void> {
    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as ClassShapeData;
    const attributes = currentData.attributes || [];

    // Store the deleted attribute for undo
    this.deletedAttribute = attributes[this.attributeIndex];
    this.deletedIndex = this.attributeIndex;

    const newData: ClassShapeData = {
      ...currentData,
      attributes: attributes.filter((_, index) => index !== this.attributeIndex),
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
    if (this.deletedAttribute === null) return;

    const shape = this.getShapeFn(this.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as ClassShapeData;
    const attributes = currentData.attributes || [];

    // Restore the attribute at the original index
    const newAttributes = [...attributes];
    newAttributes.splice(this.deletedIndex, 0, this.deletedAttribute);

    const newData: ClassShapeData = {
      ...currentData,
      attributes: newAttributes,
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
