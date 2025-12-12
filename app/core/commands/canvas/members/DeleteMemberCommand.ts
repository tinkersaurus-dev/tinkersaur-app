import type { Command } from '~/core/commands/command.types';
import type { Shape, ClassShapeData, EnumerationShapeData } from '~/core/entities/design-studio/types/Shape';
import { type MemberCommandConfig, type MemberCommandDependencies, getShapeDataByType } from './member-command.types';

/**
 * Generic command for deleting a member at a specific index from a shape's array property
 *
 * @template TData - The shape data type (e.g., ClassShapeData, EnumerationShapeData)
 */
export class DeleteMemberCommand<TData extends ClassShapeData | EnumerationShapeData> implements Command {
  public readonly description: string;
  private deletedValue: string | null = null;
  private deletedIndex: number = -1;

  constructor(
    private readonly deps: MemberCommandDependencies,
    private readonly config: MemberCommandConfig<TData>,
    private readonly index: number
  ) {
    this.description = `Delete ${config.memberTypeName} at index ${index}`;
  }

  async execute(): Promise<void> {
    const shape = this.deps.getShapeFn(this.deps.shapeId);
    if (!shape) return;

    const currentData = getShapeDataByType<TData>(shape, this.config.shapeType);
    const arrayProperty = this.config.arrayProperty as keyof TData;
    const currentArray = (currentData[arrayProperty] as string[]) || [];

    // Store for undo
    this.deletedValue = currentArray[this.index];
    this.deletedIndex = this.index;

    const newData = {
      ...currentData,
      [arrayProperty]: currentArray.filter((_, i) => i !== this.index),
    } as TData;

    const updates: Partial<Shape> = {
      data: newData,
    };

    if (this.config.calculateHeight) {
      updates.height = this.config.calculateHeight(newData);
    }

    await this.deps.updateShapeFn(this.deps.diagramId, this.deps.shapeId, updates);
    this.deps.updateLocalShapeFn?.(this.deps.shapeId, updates);
  }

  async undo(): Promise<void> {
    if (this.deletedValue === null) return;

    const shape = this.deps.getShapeFn(this.deps.shapeId);
    if (!shape) return;

    const currentData = getShapeDataByType<TData>(shape, this.config.shapeType);
    const arrayProperty = this.config.arrayProperty as keyof TData;
    const currentArray = (currentData[arrayProperty] as string[]) || [];

    // Restore at original index
    const newArray = [...currentArray];
    newArray.splice(this.deletedIndex, 0, this.deletedValue);

    const newData = {
      ...currentData,
      [arrayProperty]: newArray,
    } as TData;

    const updates: Partial<Shape> = {
      data: newData,
    };

    if (this.config.calculateHeight) {
      updates.height = this.config.calculateHeight(newData);
    }

    await this.deps.updateShapeFn(this.deps.diagramId, this.deps.shapeId, updates);
    this.deps.updateLocalShapeFn?.(this.deps.shapeId, updates);
  }
}
