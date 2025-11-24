import type { Command } from '../../command.types';
import type { Shape } from '../../../entities/design-studio/types/Shape';
import type { Diagram } from '../../../entities/design-studio/types';

/**
 * Command for updating parent-child relationships between shapes
 * Handles both adding a child to a parent and removing a child from a parent
 * Updates both parentId on child and children array on parent
 */
export class UpdateParentChildCommand implements Command {
  public readonly description: string;
  private previousParentId?: string;
  private previousParentChildren?: string[];

  constructor(
    private readonly diagramId: string,
    private readonly childShapeId: string,
    private readonly newParentId: string | undefined,
    private readonly updateShapesFn: (
      diagramId: string,
      updates: Array<{ shapeId: string; updates: Partial<Shape> }>
    ) => Promise<Diagram | null>,
    private readonly getDiagramFn: (diagramId: string) => Diagram | null,
    private readonly updateLocalShapeFn?: (
      shapeId: string,
      updates: Partial<Shape>
    ) => void
  ) {
    if (newParentId) {
      this.description = 'Add shape to container';
    } else {
      this.description = 'Remove shape from container';
    }
  }

  async execute(): Promise<void> {
    const diagram = this.getDiagramFn(this.diagramId);
    if (!diagram) {
      throw new Error(`Diagram ${this.diagramId} not found`);
    }

    const childShape = diagram.shapes.find((s) => s.id === this.childShapeId);
    if (!childShape) {
      throw new Error(`Child shape ${this.childShapeId} not found`);
    }

    // Store previous state for undo
    this.previousParentId = childShape.parentId;

    const updates: Array<{ shapeId: string; updates: Partial<Shape> }> = [];

    // Remove from previous parent if exists
    if (this.previousParentId) {
      const previousParent = diagram.shapes.find((s) => s.id === this.previousParentId);
      if (previousParent) {
        this.previousParentChildren = previousParent.children || [];
        const updatedChildren = this.previousParentChildren.filter(
          (id) => id !== this.childShapeId
        );
        updates.push({
          shapeId: this.previousParentId,
          updates: { children: updatedChildren },
        });
      }
    }

    // Add to new parent if specified
    if (this.newParentId) {
      const newParent = diagram.shapes.find((s) => s.id === this.newParentId);
      if (!newParent) {
        throw new Error(`New parent shape ${this.newParentId} not found`);
      }

      const currentChildren = newParent.children || [];
      const updatedChildren = [...currentChildren, this.childShapeId];
      updates.push({
        shapeId: this.newParentId,
        updates: { children: updatedChildren },
      });
    }

    // Update child's parentId
    updates.push({
      shapeId: this.childShapeId,
      updates: { parentId: this.newParentId },
    });

    // Execute batch update
    await this.updateShapesFn(this.diagramId, updates);

    // Update local state
    if (this.updateLocalShapeFn) {
      updates.forEach((update) => {
        this.updateLocalShapeFn!(update.shapeId, update.updates);
      });
    }
  }

  async undo(): Promise<void> {
    const diagram = this.getDiagramFn(this.diagramId);
    if (!diagram) {
      throw new Error(`Diagram ${this.diagramId} not found`);
    }

    const updates: Array<{ shapeId: string; updates: Partial<Shape> }> = [];

    // Restore previous parent if existed
    if (this.previousParentId && this.previousParentChildren) {
      updates.push({
        shapeId: this.previousParentId,
        updates: { children: this.previousParentChildren },
      });
    }

    // Remove from new parent if specified
    if (this.newParentId) {
      const newParent = diagram.shapes.find((s) => s.id === this.newParentId);
      if (newParent) {
        const currentChildren = newParent.children || [];
        const updatedChildren = currentChildren.filter(
          (id) => id !== this.childShapeId
        );
        updates.push({
          shapeId: this.newParentId,
          updates: { children: updatedChildren },
        });
      }
    }

    // Restore child's previous parentId
    updates.push({
      shapeId: this.childShapeId,
      updates: { parentId: this.previousParentId },
    });

    // Execute batch update
    await this.updateShapesFn(this.diagramId, updates);

    // Update local state
    if (this.updateLocalShapeFn) {
      updates.forEach((update) => {
        this.updateLocalShapeFn!(update.shapeId, update.updates);
      });
    }
  }
}
