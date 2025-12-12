import type { Command } from '~/core/commands/command.types';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { MemberCommandConfig, MemberCommandDependencies } from './member-command.types';

/**
 * Generic command for adding a string member to a shape's array property
 *
 * @template TData - The shape data type (e.g., ClassShapeData, EnumerationShapeData)
 */
export class AddMemberCommand<TData> implements Command {
  public readonly description: string;

  constructor(
    private readonly deps: MemberCommandDependencies,
    private readonly config: MemberCommandConfig<TData>,
    private readonly value: string
  ) {
    this.description = `Add ${config.memberTypeName}: "${value}"`;
  }

  async execute(): Promise<void> {
    const shape = this.deps.getShapeFn(this.deps.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as TData;
    const arrayProperty = this.config.arrayProperty as keyof TData;
    const currentArray = (currentData[arrayProperty] as string[]) || [];

    const newData = {
      ...currentData,
      [arrayProperty]: [...currentArray, this.value],
    } as TData;

    const updates: Partial<Shape> = {
      data: newData as unknown as Record<string, unknown>,
    };

    if (this.config.calculateHeight) {
      updates.height = this.config.calculateHeight(newData);
    }

    await this.deps.updateShapeFn(this.deps.diagramId, this.deps.shapeId, updates);
    this.deps.updateLocalShapeFn?.(this.deps.shapeId, updates);
  }

  async undo(): Promise<void> {
    const shape = this.deps.getShapeFn(this.deps.shapeId);
    if (!shape) return;

    const currentData = (shape.data || {}) as unknown as TData;
    const arrayProperty = this.config.arrayProperty as keyof TData;
    const currentArray = (currentData[arrayProperty] as string[]) || [];

    const newData = {
      ...currentData,
      [arrayProperty]: currentArray.filter((item) => item !== this.value),
    } as TData;

    const updates: Partial<Shape> = {
      data: newData as unknown as Record<string, unknown>,
    };

    if (this.config.calculateHeight) {
      updates.height = this.config.calculateHeight(newData);
    }

    await this.deps.updateShapeFn(this.deps.diagramId, this.deps.shapeId, updates);
    this.deps.updateLocalShapeFn?.(this.deps.shapeId, updates);
  }
}
