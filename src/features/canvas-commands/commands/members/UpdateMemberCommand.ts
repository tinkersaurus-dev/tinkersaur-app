import type { Command } from '../../model/command.types';
import type { Shape, ClassShapeData, EnumerationShapeData } from '@/entities/shape';
import { type MemberCommandConfig, type MemberCommandDependencies, getShapeDataByType } from './member-command.types';

/**
 * Generic command for updating a member at a specific index in a shape's array property
 *
 * @template TData - The shape data type (e.g., ClassShapeData, EnumerationShapeData)
 */
export class UpdateMemberCommand<TData extends ClassShapeData | EnumerationShapeData> implements Command {
  public readonly description: string;

  constructor(
    private readonly deps: MemberCommandDependencies,
    private readonly config: MemberCommandConfig<TData>,
    private readonly index: number,
    private readonly oldValue: string,
    private readonly newValue: string
  ) {
    this.description = `Update ${config.memberTypeName}: "${oldValue}" -> "${newValue}"`;
  }

  private async applyUpdate(value: string): Promise<void> {
    const shape = this.deps.getShapeFn(this.deps.shapeId);
    if (!shape) return;

    const currentData = getShapeDataByType<TData>(shape, this.config.shapeType);
    const arrayProperty = this.config.arrayProperty as keyof TData;
    const currentArray = (currentData[arrayProperty] as string[]) || [];

    const newArray = [...currentArray];
    newArray[this.index] = value;

    const newData = {
      ...currentData,
      [arrayProperty]: newArray,
    } as TData;

    const updates: Partial<Shape> = {
      data: newData,
    };

    await this.deps.updateShapeFn(this.deps.diagramId, this.deps.shapeId, updates);
    this.deps.updateLocalShapeFn?.(this.deps.shapeId, updates);
  }

  async execute(): Promise<void> {
    await this.applyUpdate(this.newValue);
  }

  async undo(): Promise<void> {
    await this.applyUpdate(this.oldValue);
  }
}
