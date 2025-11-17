import type { Command } from '../../command.types';
import type { Shape } from '../../../entities/design-studio/types/Shape';
import type { Diagram } from '../../../entities/design-studio/types';

export class UpdateShapeDataCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly oldData: Record<string, unknown> | undefined,
    private readonly newData: Record<string, unknown> | undefined,
    private readonly updateShapeFn: (
      diagramId: string,
      shapeId: string,
      updates: Partial<Shape>
    ) => Promise<Diagram | null>,
    private readonly updateLocalShapeFn?: (
      shapeId: string,
      updates: Partial<Shape>
    ) => void
  ) {
    this.description = `Update shape data`;
  }

  async execute(): Promise<void> {
    await this.updateShapeFn(this.diagramId, this.shapeId, {
      data: this.newData,
    });

    this.updateLocalShapeFn?.(this.shapeId, {
      data: this.newData,
    });
  }

  async undo(): Promise<void> {
    await this.updateShapeFn(this.diagramId, this.shapeId, {
      data: this.oldData,
    });

    this.updateLocalShapeFn?.(this.shapeId, {
      data: this.oldData,
    });
  }
}
