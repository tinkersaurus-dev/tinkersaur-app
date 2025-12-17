import type { Command } from '~/core/commands/command.types';
import type { Shape, EntityShapeData, EntityAttributeData } from '~/core/entities/design-studio/types/Shape';
import { getEntityShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Diagram } from '~/core/entities/design-studio/types';
import { calculateEntityHeight } from '../utils';

export interface UpdateEntityAttributeCommandDependencies {
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
 * Command for updating an attribute in an entity shape in ER diagrams
 */
export class UpdateEntityAttributeCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly deps: UpdateEntityAttributeCommandDependencies,
    private readonly attributeIndex: number,
    private readonly oldValue: EntityAttributeData,
    private readonly newValue: EntityAttributeData
  ) {
    this.description = `Update entity attribute: "${oldValue.name}" → "${newValue.name}"`;
  }

  async execute(): Promise<void> {
    const shape = this.deps.getShapeFn(this.deps.shapeId);
    if (!shape) return;

    const currentData = getEntityShapeData(shape);
    const currentAttributes = [...(currentData.attributes || [])];
    currentAttributes[this.attributeIndex] = this.newValue;

    const newData: EntityShapeData = {
      ...currentData,
      attributes: currentAttributes,
    };

    const updates: Partial<Shape> = {
      data: newData,
      height: calculateEntityHeight(newData),
    };

    await this.deps.updateShapeFn(this.deps.diagramId, this.deps.shapeId, updates);
    this.deps.updateLocalShapeFn?.(this.deps.shapeId, updates);
  }

  async undo(): Promise<void> {
    const shape = this.deps.getShapeFn(this.deps.shapeId);
    if (!shape) return;

    const currentData = getEntityShapeData(shape);
    const currentAttributes = [...(currentData.attributes || [])];
    currentAttributes[this.attributeIndex] = this.oldValue;

    const newData: EntityShapeData = {
      ...currentData,
      attributes: currentAttributes,
    };

    const updates: Partial<Shape> = {
      data: newData,
      height: calculateEntityHeight(newData),
    };

    await this.deps.updateShapeFn(this.deps.diagramId, this.deps.shapeId, updates);
    this.deps.updateLocalShapeFn?.(this.deps.shapeId, updates);
  }
}
