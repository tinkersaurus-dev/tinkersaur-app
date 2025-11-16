import type { Command } from '../command.types';
import type { CreateShapeDTO } from '../../entities/design-studio/types/Shape';
import type { Diagram, DiagramType } from '../../entities/design-studio/types';
import type { MermaidImportResult } from '~/design-studio/lib/mermaid/mermaid-importer';
import { BpmnMermaidImporter } from '~/design-studio/lib/mermaid/importers/bpmn-mermaid-importer';
import { ClassMermaidImporter } from '~/design-studio/lib/mermaid/importers/class-mermaid-importer';
import { SequenceMermaidImporter } from '~/design-studio/lib/mermaid/importers/sequence-mermaid-importer';

/**
 * Command to update a preview shape from a mermaid editor shape
 * This command:
 * 1. Parses the updated mermaid syntax using the appropriate importer
 * 2. Deletes the editor shape
 * 3. Creates an updated preview shape at the same position with the newly parsed shapes/connectors
 */
export class UpdatePreviewCommand implements Command {
  public readonly description: string;
  private previewShapeId: string | null = null;
  private editorShapeData: CreateShapeDTO | null = null;

  constructor(
    private readonly diagramId: string,
    private readonly diagramType: DiagramType,
    private readonly editorShapeId: string,
    private readonly updatedMermaidSyntax: string,
    private readonly editorPosition: { x: number; y: number; width: number; height: number },
    private readonly originalGeneratorShapeId: string,
    private readonly addShapeFn: (diagramId: string, shapeData: CreateShapeDTO) => Promise<Diagram>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly getShapeFn: (diagramId: string, shapeId: string) => CreateShapeDTO | null
  ) {
    this.description = 'Update diagram preview';
  }

  async execute(): Promise<void> {
    // Get the appropriate mermaid importer for the diagram type
    const importer = this.getImporter(this.diagramType);
    if (!importer) {
      throw new Error(`No mermaid importer found for diagram type: ${this.diagramType}`);
    }

    // Parse the updated mermaid syntax
    const parseResult = importer.import(this.updatedMermaidSyntax, {
      centerPoint: {
        x: this.editorPosition.x + this.editorPosition.width / 2,
        y: this.editorPosition.y + this.editorPosition.height / 2,
      },
    });

    if (!parseResult.ok) {
      throw new Error(`Failed to parse mermaid: ${parseResult.error}`);
    }

    const importResult: MermaidImportResult = parseResult.value;

    // Calculate bounding box of the parsed shapes to determine preview size
    const boundingBox = this.calculateBoundingBox(importResult);

    // Store editor shape data for undo
    const editorShape = this.getShapeFn(this.diagramId, this.editorShapeId);
    if (editorShape) {
      this.editorShapeData = editorShape;
    }

    // Delete the editor shape
    await this.deleteShapeFn(this.diagramId, this.editorShapeId);

    // Create the updated preview shape
    const previewShapeData: CreateShapeDTO = {
      type: 'llm-preview',
      subtype: undefined,
      x: boundingBox.x - 20, // Add padding around the preview
      y: boundingBox.y - 20,
      width: boundingBox.width + 40,
      height: boundingBox.height + 40,
      label: undefined,
      zIndex: 0,
      locked: false,
      isPreview: true,
      data: {
        mermaidSyntax: this.updatedMermaidSyntax,
        generatorShapeId: this.originalGeneratorShapeId,
        shapes: importResult.shapes,
        connectors: importResult.connectors,
      },
    };

    const diagram = await this.addShapeFn(this.diagramId, previewShapeData);

    // Store the preview shape ID for undo
    if (diagram.shapes.length > 0) {
      this.previewShapeId = diagram.shapes[diagram.shapes.length - 1].id;
    }
  }

  async undo(): Promise<void> {
    if (!this.previewShapeId || !this.editorShapeData) {
      console.warn('Cannot undo UpdatePreviewCommand: missing data');
      return;
    }

    // Delete the preview shape
    await this.deleteShapeFn(this.diagramId, this.previewShapeId);

    // Restore the editor shape
    await this.addShapeFn(this.diagramId, this.editorShapeData);
  }

  /**
   * Get the appropriate mermaid importer for the diagram type
   */
  private getImporter(diagramType: DiagramType) {
    switch (diagramType) {
      case 'bpmn':
        return new BpmnMermaidImporter();
      case 'class':
        return new ClassMermaidImporter();
      case 'sequence':
        return new SequenceMermaidImporter();
      default:
        return null;
    }
  }

  /**
   * Calculate the bounding box that contains all shapes and connectors
   */
  private calculateBoundingBox(importResult: MermaidImportResult): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (importResult.shapes.length === 0) {
      // Return default size if no shapes
      return {
        x: this.editorPosition.x,
        y: this.editorPosition.y,
        width: 300,
        height: 200,
      };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const shape of importResult.shapes) {
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Get the ID of the preview shape that was created (available after execute)
   */
  getPreviewShapeId(): string | null {
    return this.previewShapeId;
  }
}
