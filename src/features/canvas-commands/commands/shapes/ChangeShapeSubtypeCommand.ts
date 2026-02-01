import type { Command } from '../../model/command.types';
import type { Shape } from '@/entities/shape';
import type { Diagram } from '@/entities/diagram';

/**
 * Data required to change a shape's subtype
 */
export interface ChangeShapeSubtypeData {
  id: string;
  subtype: string;
  /** Optional data updates (e.g., icon field for architecture-service) */
  data?: Record<string, unknown>;
}

/**
 * Command to change a shape's subtype (and optionally associated data)
 * Stores the previous state for undo
 */
export class ChangeShapeSubtypeCommand implements Command {
  public readonly description: string;
  private previousSubtype: string | undefined = undefined;
  private previousData: Record<string, unknown> | undefined = undefined;

  constructor(
    private readonly diagramId: string,
    private readonly shapeId: string,
    private readonly newSubtypeData: ChangeShapeSubtypeData,
    private readonly updateShapeFn: (
      diagramId: string,
      shapeId: string,
      updates: Partial<Shape>
    ) => Promise<Diagram | null>,
    private readonly getCurrentShapeFn: (
      diagramId: string,
      shapeId: string
    ) => Shape | null,
    private readonly updateLocalShapeFn?: (
      shapeId: string,
      updates: Partial<Shape>
    ) => void
  ) {
    this.description = `Change shape subtype to ${newSubtypeData.subtype}`;
  }

  async execute(): Promise<void> {
    // Store the current state for undo
    const currentShape = this.getCurrentShapeFn(this.diagramId, this.shapeId);
    if (currentShape) {
      this.previousSubtype = currentShape.subtype;
      this.previousData = currentShape.data;
    }

    // Build the updates object
    const updates: Partial<Shape> = {
      subtype: this.newSubtypeData.subtype,
    };

    // If new data is provided, merge it with existing data
    if (this.newSubtypeData.data) {
      updates.data = {
        ...this.previousData,
        ...this.newSubtypeData.data,
      };
    }

    // Apply the updates to entity store
    await this.updateShapeFn(this.diagramId, this.shapeId, updates);

    // Update local canvas state immediately for visual feedback
    this.updateLocalShapeFn?.(this.shapeId, updates);
  }

  async undo(): Promise<void> {
    // Build the undo updates
    const updates: Partial<Shape> = {
      subtype: this.previousSubtype,
    };

    // Restore previous data if we changed it
    if (this.newSubtypeData.data) {
      updates.data = this.previousData;
    }

    // Restore the previous state in entity store
    await this.updateShapeFn(this.diagramId, this.shapeId, updates);

    // Update local canvas state immediately for visual feedback
    this.updateLocalShapeFn?.(this.shapeId, updates);
  }
}
