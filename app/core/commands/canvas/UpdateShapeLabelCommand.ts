import type { Command } from '../command.types';
import type { Shape } from '../../entities/design-studio/types/Shape';
import type { Diagram } from '../../entities/design-studio/types';

export class UpdateShapeLabelCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly oldLabel: string | undefined,
    private readonly newLabel: string | undefined,
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
    const oldText = oldLabel || '(empty)';
    const newText = newLabel || '(empty)';
    this.description = `Edit shape label: "${oldText}" → "${newText}"`;
  }

  async execute(): Promise<void> {
    await this.updateShapeFn(this.diagramId, this.shapeId, {
      label: this.newLabel,
    });

    this.updateLocalShapeFn?.(this.shapeId, {
      label: this.newLabel,
    });
  }

  async undo(): Promise<void> {
    await this.updateShapeFn(this.diagramId, this.shapeId, {
      label: this.oldLabel,
    });

    this.updateLocalShapeFn?.(this.shapeId, {
      label: this.oldLabel,
    });
  }
}
