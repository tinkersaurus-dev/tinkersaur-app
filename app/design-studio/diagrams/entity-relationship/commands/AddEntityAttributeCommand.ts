import type { Command } from '~/core/commands/command.types';
import type { Shape, EntityShapeData, EntityAttributeData } from '~/core/entities/design-studio/types/Shape';
import { getEntityShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Diagram } from '~/core/entities/design-studio/types';
import { calculateEntityHeight } from '../utils';

export interface AddEntityAttributeCommandDependencies {
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
 * Command for adding an attribute to an entity shape in ER diagrams
 */
export class AddEntityAttributeCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly deps: AddEntityAttributeCommandDependencies,
    private readonly attribute: EntityAttributeData = { type: 'string', name: 'attribute' }
  ) {
    this.description = `Add entity attribute: "${attribute.name}"`;
  }

  async execute(): Promise<void> {
    const shape = this.deps.getShapeFn(this.deps.shapeId);
    if (!shape) return;

    const currentData = getEntityShapeData(shape);
    const currentAttributes = currentData.attributes || [];

    const newData: EntityShapeData = {
      ...currentData,
      attributes: [...currentAttributes, this.attribute],
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
    const currentAttributes = currentData.attributes || [];

    // Remove the last attribute (the one we added)
    const newData: EntityShapeData = {
      ...currentData,
      attributes: currentAttributes.slice(0, -1),
    };

    const updates: Partial<Shape> = {
      data: newData,
      height: calculateEntityHeight(newData),
    };

    await this.deps.updateShapeFn(this.deps.diagramId, this.deps.shapeId, updates);
    this.deps.updateLocalShapeFn?.(this.deps.shapeId, updates);
  }
}
