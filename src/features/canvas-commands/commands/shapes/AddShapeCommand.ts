import type { Command } from '../../model/command.types';
import type { CreateShapeDTO } from '@/entities/shape';
import type { Diagram } from '@/entities/diagram';

/**
 * Command to add a shape to a diagram
 * Stores the shape data and provides functions to add/remove it
 */
export class AddShapeCommand implements Command {
  public readonly description: string;
  private shapeId: string | null = null;

  constructor(
    private readonly diagramId: string,
    private readonly shapeData: CreateShapeDTO,
    private readonly addShapeFn: (diagramId: string, shapeData: CreateShapeDTO) => Promise<Diagram>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>
  ) {
    this.description = `Add ${shapeData.type}`;
  }

  async execute(): Promise<void> {
    const diagram = await this.addShapeFn(this.diagramId, this.shapeData);

    // Store the generated shape ID for undo
    // The newly added shape is the last one in the array
    if (diagram.shapes.length > 0) {
      this.shapeId = diagram.shapes[diagram.shapes.length - 1].id;
    }
  }

  async undo(): Promise<void> {
    if (!this.shapeId) {
      console.warn('Cannot undo AddShapeCommand: shape ID not found');
      return;
    }

    await this.deleteShapeFn(this.diagramId, this.shapeId);
  }

  /**
   * Get the ID of the shape that was added (available after execute)
   */
  getShapeId(): string | null {
    return this.shapeId;
  }
}
