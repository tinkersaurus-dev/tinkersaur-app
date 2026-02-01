/**
 * Refresh Sequence Activations Command
 *
 * Recalculates and updates activation boxes for all sequence lifelines in a diagram.
 * This command should be triggered when connectors are added, deleted, or modified
 * in sequence diagrams.
 */

import type { Command } from '@/features/canvas-commands/model/command.types';
import type { Diagram } from '@/entities/diagram';
import type { Shape, ActivationBox, SequenceLifelineData } from '@/entities/shape';
import { calculateAllLifelineActivations } from '../activationCalculator';
import { UpdateLifelineActivationsCommand } from './UpdateLifelineActivationsCommand';

export class RefreshSequenceActivationsCommand implements Command {
  public readonly description: string = 'Refresh sequence activations';

  private updateCommands: UpdateLifelineActivationsCommand[] = [];

  constructor(
    private readonly diagramId: string,
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
  ) {}

  async execute(): Promise<void> {
    const diagram = this.getDiagramFn(this.diagramId);

    if (!diagram) {
      console.warn(`Diagram ${this.diagramId} not found for activation refresh`);
      return;
    }

    // Only process sequence diagrams
    if (diagram.type !== 'sequence') {
      return;
    }

    // Calculate activations for all lifelines
    const activationsMap = calculateAllLifelineActivations(
      diagram.shapes,
      diagram.connectors || []
    );

    // Create update commands for each lifeline
    this.updateCommands = [];

    for (const [shapeId, newActivations] of activationsMap.entries()) {
      const shape = diagram.shapes.find((s) => s.id === shapeId);
      if (!shape) continue;

      // Get current activations for undo
      const currentData = shape.data as SequenceLifelineData | undefined;
      const oldActivations = currentData?.activations || [];

      // Only create update command if activations changed
      if (!activationsEqual(oldActivations, newActivations)) {
        const updateCommand = new UpdateLifelineActivationsCommand(
          this.diagramId,
          shapeId,
          oldActivations,
          newActivations,
          this.getDiagramFn,
          this.updateShapeFn,
          this.updateLocalShapeFn
        );

        this.updateCommands.push(updateCommand);
      }
    }

    // Execute all update commands
    for (const cmd of this.updateCommands) {
      await cmd.execute();
    }
  }

  async undo(): Promise<void> {
    // Undo all update commands in reverse order
    for (let i = this.updateCommands.length - 1; i >= 0; i--) {
      await this.updateCommands[i].undo();
    }
  }
}

/**
 * Helper to compare two activation arrays for equality.
 * Used to avoid unnecessary updates when activations haven't changed.
 */
function activationsEqual(a: ActivationBox[], b: ActivationBox[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (
      a[i].startY !== b[i].startY ||
      a[i].endY !== b[i].endY ||
      a[i].depth !== b[i].depth
    ) {
      return false;
    }
  }

  return true;
}
