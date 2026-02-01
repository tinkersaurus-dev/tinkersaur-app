import type { Command } from '@/features/canvas-commands/model/command.types';
import type { Shape, EntityShapeData, EntityAttributeData } from '@/entities/shape';
import { getEntityShapeData } from '@/entities/shape';
import type { Diagram } from '@/entities/diagram';
import { calculateEntityHeight } from '../utils';

export interface DeleteEntityAttributeCommandDependencies {
  diagramId: string;
  shapeId: string;
  updateShapeFn: (
    diagramId: string,
    shapeId: string,
    updates: Partial<Shape>
  ) => Promise<Diagram | null>;
  getShapeFn: (shapeId: string) => Shape | undefined;
  updateLocalShapeFn?: (shapeId: string, updates: Partial<Shape>) => void;
}

/**
 * Command for deleting an attribute from an entity shape in ER diagrams
 */
export class DeleteEntityAttributeCommand implements Command {
  public readonly description: string;
  private deletedAttribute: EntityAttributeData | null = null;

  constructor(
    private readonly deps: DeleteEntityAttributeCommandDependencies,
    private readonly attributeIndex: number
  ) {
    this.description = `Delete entity attribute at index ${attributeIndex}`;
  }

  async execute(): Promise<void> {
    const shape = this.deps.getShapeFn(this.deps.shapeId);
    if (!shape) return;

    const currentData = getEntityShapeData(shape);
    const currentAttributes = currentData.attributes || [];

    // Store the deleted attribute for undo
    this.deletedAttribute = currentAttributes[this.attributeIndex] ?? null;

    const newData: EntityShapeData = {
      ...currentData,
      attributes: currentAttributes.filter((_, index) => index !== this.attributeIndex),
    };

    const updates: Partial<Shape> = {
      data: newData,
      height: calculateEntityHeight(newData),
    };

    await this.deps.updateShapeFn(this.deps.diagramId, this.deps.shapeId, updates);
    this.deps.updateLocalShapeFn?.(this.deps.shapeId, updates);
  }

  async undo(): Promise<void> {
    if (!this.deletedAttribute) return;

    const shape = this.deps.getShapeFn(this.deps.shapeId);
    if (!shape) return;

    const currentData = getEntityShapeData(shape);
    const currentAttributes = currentData.attributes || [];

    // Re-insert the deleted attribute at its original position
    const newAttributes = [...currentAttributes];
    newAttributes.splice(this.attributeIndex, 0, this.deletedAttribute);

    const newData: EntityShapeData = {
      ...currentData,
      attributes: newAttributes,
    };

    const updates: Partial<Shape> = {
      data: newData,
      height: calculateEntityHeight(newData),
    };

    await this.deps.updateShapeFn(this.deps.diagramId, this.deps.shapeId, updates);
    this.deps.updateLocalShapeFn?.(this.deps.shapeId, updates);
  }
}
