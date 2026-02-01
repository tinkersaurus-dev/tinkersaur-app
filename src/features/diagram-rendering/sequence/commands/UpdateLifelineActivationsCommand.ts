/**
 * Update Lifeline Activations Command
 *
 * Updates the activation boxes for a sequence diagram lifeline.
 * Activation boxes show periods when a participant is actively processing.
 */

import type { Command } from '@/features/canvas-commands/model/command.types';
import type { Shape, ActivationBox, SequenceLifelineData } from '@/entities/shape';
import type { Diagram } from '@/entities/diagram';

export class UpdateLifelineActivationsCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly oldActivations: ActivationBox[],
    private readonly newActivations: ActivationBox[],
    private readonly getDiagramFn: (diagramId: string) => Diagram | null | undefined,
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
    this.description = `Update lifeline activations`;
  }

  async execute(): Promise<void> {
    await this.updateActivations(this.newActivations);
  }

  async undo(): Promise<void> {
    await this.updateActivations(this.oldActivations);
  }

  private async updateActivations(activations: ActivationBox[]): Promise<void> {
    // Get current shape to preserve other data fields
    const diagram = this.getDiagramFn(this.diagramId);
    const shape = diagram?.shapes.find((s) => s.id === this.shapeId);

    if (!shape) {
      console.warn(`Shape ${this.shapeId} not found for activation update`);
      return;
    }

    // Merge activations into existing shape data
    const currentData = shape.data as SequenceLifelineData | undefined;
    const newData: Record<string, unknown> = {
      ...(currentData || {}),
      lifelineStyle: currentData?.lifelineStyle || 'dashed',
      activations,
    };

    // Update in entity store
    await this.updateShapeFn(this.diagramId, this.shapeId, {
      data: newData,
    });

    // Update local canvas state for immediate UI feedback
    this.updateLocalShapeFn?.(this.shapeId, {
      data: newData,
    });
  }
}
