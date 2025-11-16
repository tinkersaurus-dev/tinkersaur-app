import type { Command } from '../command.types';
import type { CreateShapeDTO } from '../../entities/design-studio/types/Shape';
import type { Diagram } from '../../entities/design-studio/types';

/**
 * Command to replace a preview shape with a mermaid editor shape
 * This command:
 * 1. Deletes the preview shape
 * 2. Creates a mermaid editor shape at the same position with the mermaid syntax
 */
export class ReplaceWithEditorCommand implements Command {
  public readonly description: string;
  private editorShapeId: string | null = null;
  private previewShapeData: CreateShapeDTO | null = null;

  constructor(
    private readonly diagramId: string,
    private readonly previewShapeId: string,
    private readonly mermaidSyntax: string,
    private readonly previewPosition: { x: number; y: number; width: number; height: number },
    private readonly addShapeFn: (diagramId: string, shapeData: CreateShapeDTO) => Promise<Diagram>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly getShapeFn: (diagramId: string, shapeId: string) => CreateShapeDTO | null
  ) {
    this.description = 'Edit mermaid syntax';
  }

  async execute(): Promise<void> {
    // Store preview shape data for undo
    const previewShape = this.getShapeFn(this.diagramId, this.previewShapeId);
    if (previewShape) {
      this.previewShapeData = previewShape;
    }

    // Delete the preview shape
    await this.deleteShapeFn(this.diagramId, this.previewShapeId);

    // Create the mermaid editor shape at a reasonable size
    const editorWidth = Math.max(400, this.previewPosition.width);
    const editorHeight = Math.max(300, this.previewPosition.height);

    const editorShapeData: CreateShapeDTO = {
      type: 'mermaid-editor',
      subtype: undefined,
      x: this.previewPosition.x,
      y: this.previewPosition.y,
      width: editorWidth,
      height: editorHeight,
      label: undefined,
      zIndex: 0,
      locked: false,
      data: {
        mermaidSyntax: this.mermaidSyntax,
        previewShapeId: this.previewShapeId,
        error: undefined,
      },
    };

    const diagram = await this.addShapeFn(this.diagramId, editorShapeData);

    // Store the editor shape ID for undo
    if (diagram.shapes.length > 0) {
      this.editorShapeId = diagram.shapes[diagram.shapes.length - 1].id;
    }
  }

  async undo(): Promise<void> {
    if (!this.editorShapeId || !this.previewShapeData) {
      console.warn('Cannot undo ReplaceWithEditorCommand: missing data');
      return;
    }

    // Delete the editor shape
    await this.deleteShapeFn(this.diagramId, this.editorShapeId);

    // Restore the preview shape
    await this.addShapeFn(this.diagramId, this.previewShapeData);
  }

  /**
   * Get the ID of the editor shape that was created (available after execute)
   */
  getEditorShapeId(): string | null {
    return this.editorShapeId;
  }
}
