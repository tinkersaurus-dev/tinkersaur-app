/**
 * Update Lifeline Heights Command
 *
 * Updates the height of all sequence lifelines in a diagram to maintain
 * synchronized heights and accommodate message connectors.
 */

import type { Command } from '~/core/commands/command.types';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Diagram } from '~/core/entities/design-studio/types';

interface ShapeHeightUpdate {
  shapeId: string;
  oldHeight: number;
  newHeight: number;
}

export class UpdateLifelineHeightsCommand implements Command {
  public readonly description: string;
  private updates: ShapeHeightUpdate[] = [];

  constructor(
    private readonly diagramId: string,
    private readonly newHeight: number,
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
    this.description = `Update lifeline heights to ${newHeight}px`;
  }

  async execute(): Promise<void> {
    const diagram = this.getDiagramFn(this.diagramId);

    if (!diagram) {
      console.warn(`Diagram ${this.diagramId} not found for height update`);
      return;
    }

    // Only process sequence diagrams
    if (diagram.type !== 'sequence') {
      return;
    }

    // Find all sequence lifeline shapes
    const lifelines = diagram.shapes.filter(
      (shape) => shape.type === 'sequence-lifeline'
    );

    // Store old heights for undo and check if update is needed
    this.updates = [];
    let needsUpdate = false;

    for (const lifeline of lifelines) {
      if (lifeline.height !== this.newHeight) {
        this.updates.push({
          shapeId: lifeline.id,
          oldHeight: lifeline.height,
          newHeight: this.newHeight,
        });
        needsUpdate = true;
      }
    }

    // If no updates needed, skip execution
    if (!needsUpdate) {
      return;
    }

    // Execute all updates
    for (const update of this.updates) {
      await this.updateShapeFn(this.diagramId, update.shapeId, {
        height: update.newHeight,
      });

      this.updateLocalShapeFn?.(update.shapeId, {
        height: update.newHeight,
      });
    }
  }

  async undo(): Promise<void> {
    // Restore old heights in reverse order
    for (let i = this.updates.length - 1; i >= 0; i--) {
      const update = this.updates[i];

      await this.updateShapeFn(this.diagramId, update.shapeId, {
        height: update.oldHeight,
      });

      this.updateLocalShapeFn?.(update.shapeId, {
        height: update.oldHeight,
      });
    }
  }
}
