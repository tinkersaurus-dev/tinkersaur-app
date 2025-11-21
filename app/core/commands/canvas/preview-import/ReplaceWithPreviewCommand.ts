import type { Command } from '../../command.types';
import type { CreateShapeDTO, Shape } from '../../../entities/design-studio/types/Shape';
import type { CreateConnectorDTO } from '../../../entities/design-studio/types/Connector';
import type { Diagram, DiagramType } from '../../../entities/design-studio/types';
import type { MermaidImportResult } from '~/design-studio/lib/mermaid/mermaid-importer';
import { BpmnMermaidImporter } from '~/design-studio/lib/mermaid/importers/bpmn-mermaid-importer';
import { ClassMermaidImporter } from '~/design-studio/lib/mermaid/importers/class-mermaid-importer';
import { SequenceMermaidImporter} from '~/design-studio/lib/mermaid/importers/sequence-mermaid-importer';
import { DESIGN_STUDIO_CONFIG } from '~/design-studio/config/design-studio-config';

/**
 * Command to replace a generator shape with a preview shape
 * This command:
 * 1. Parses the generated mermaid syntax using the appropriate importer
 * 2. Deletes the generator shape
 * 3. Creates a preview container shape with metadata
 * 4. Creates all preview shapes and connectors as actual diagram entities (marked with isPreview)
 */
export class ReplaceWithPreviewCommand implements Command {
  public readonly description: string;
  private previewShapeId: string | null = null;
  private previewContentShapeIds: string[] = [];
  private previewContentConnectorIds: string[] = [];
  private generatorShapeData: CreateShapeDTO | null = null;

  constructor(
    private readonly diagramId: string,
    private readonly diagramType: DiagramType,
    private readonly generatorShapeId: string,
    private readonly mermaidSyntax: string,
    private readonly generatorPosition: { x: number; y: number; width: number; height: number },
    private readonly addShapeFn: (diagramId: string, shapeData: CreateShapeDTO) => Promise<Diagram>,
    private readonly addConnectorFn: (diagramId: string, connectorData: CreateConnectorDTO) => Promise<Diagram | null>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly deleteConnectorFn: (diagramId: string, connectorId: string) => Promise<Diagram | null>,
    private readonly getShapeFn: (diagramId: string, shapeId: string) => Promise<Shape | null>,
    private readonly addShapesBatchFn?: (diagramId: string, shapes: CreateShapeDTO[]) => Promise<Diagram>,
    private readonly addConnectorsBatchFn?: (diagramId: string, connectors: CreateConnectorDTO[]) => Promise<Diagram | null>
  ) {
    this.description = 'Replace generator with preview';
  }

  async execute(): Promise<void> {
    // Get the appropriate mermaid importer for the diagram type
    const importer = this.getImporter(this.diagramType);
    if (!importer) {
      console.error('[ReplaceWithPreviewCommand] No importer found for:', this.diagramType);
      throw new Error(`No mermaid importer found for diagram type: ${this.diagramType}`);
    }
    // Parse the mermaid syntax
    const parseResult = importer.import(this.mermaidSyntax, {
      centerPoint: {
        x: this.generatorPosition.x + this.generatorPosition.width / 2,
        y: this.generatorPosition.y + this.generatorPosition.height / 2,
      },
    });

    if (!parseResult.ok) {
      console.error('[ReplaceWithPreviewCommand] Parse failed:', parseResult.error);
      throw new Error(`Failed to parse mermaid: ${parseResult.error}`);
    }

    const importResult: MermaidImportResult = parseResult.value;

    // Calculate bounding box of the parsed shapes to determine preview size
    const boundingBox = this.calculateBoundingBox(importResult);

    // Store generator shape data for undo
    const generatorShape = await this.getShapeFn(this.diagramId, this.generatorShapeId);
    if (generatorShape) {
      // Convert Shape to CreateShapeDTO by removing the id field
      const { id: _id, ...shapeData } = generatorShape;
      this.generatorShapeData = shapeData;
    }

    // Delete the generator shape
    await this.deleteShapeFn(this.diagramId, this.generatorShapeId);

    // Track shape IDs by their index in the import result
    const createdShapeIds: string[] = [];

    // Create all preview shapes as actual diagram entities (marked with isPreview)
    // Prepare all shape DTOs with isPreview flag
    const shapeDTOs = importResult.shapes.map(shapeData => ({
      ...shapeData,
      isPreview: true, // Mark as preview to disable interactivity
    }));

    // Use batch operation if available, otherwise add one by one
    if (this.addShapesBatchFn && shapeDTOs.length > 0) {
      const diagram = await this.addShapesBatchFn(this.diagramId, shapeDTOs);
      const startIndex = diagram.shapes.length - shapeDTOs.length;
      for (let i = 0; i < shapeDTOs.length; i++) {
        const newShapeId = diagram.shapes[startIndex + i].id;
        createdShapeIds.push(newShapeId);
        this.previewContentShapeIds.push(newShapeId);
      }
    } else {
      for (const shapeDTO of shapeDTOs) {
        const diagram = await this.addShapeFn(this.diagramId, shapeDTO);
        if (diagram && diagram.shapes.length > 0) {
          const newShapeId = diagram.shapes[diagram.shapes.length - 1].id;
          createdShapeIds.push(newShapeId);
          this.previewContentShapeIds.push(newShapeId);
        }
      }
    }

    // Create all preview connectors using shape indices
    // Prepare all connector DTOs with actual shape IDs
    const connectorDTOs: CreateConnectorDTO[] = [];
    for (const connectorRef of importResult.connectors) {
      // Look up the actual shape IDs using the indices
      const fromShapeId = createdShapeIds[connectorRef.fromShapeIndex];
      const toShapeId = createdShapeIds[connectorRef.toShapeIndex];

      if (!fromShapeId || !toShapeId) {
        console.error('[ReplaceWithPreviewCommand] Cannot create connector - invalid shape index:', {
          fromShapeIndex: connectorRef.fromShapeIndex,
          toShapeIndex: connectorRef.toShapeIndex,
          fromShapeId,
          toShapeId,
        });
        continue; // Skip this connector
      }

      connectorDTOs.push({
        type: connectorRef.type,
        sourceShapeId: fromShapeId,
        targetShapeId: toShapeId,
        sourceConnectionPoint: connectorRef.sourceConnectionPoint,
        targetConnectionPoint: connectorRef.targetConnectionPoint,
        style: connectorRef.style,
        markerStart: connectorRef.markerStart,
        markerEnd: connectorRef.markerEnd,
        lineType: connectorRef.lineType,
        points: connectorRef.points,
        label: connectorRef.label,
        sourceCardinality: connectorRef.sourceCardinality,
        targetCardinality: connectorRef.targetCardinality,
        zIndex: connectorRef.zIndex,
      });
    }

    // Use batch operation if available, otherwise add one by one
    if (this.addConnectorsBatchFn && connectorDTOs.length > 0) {
      const diagram = await this.addConnectorsBatchFn(this.diagramId, connectorDTOs);
      if (diagram) {
        const startIndex = diagram.connectors.length - connectorDTOs.length;
        for (let i = 0; i < connectorDTOs.length; i++) {
          const newConnectorId = diagram.connectors[startIndex + i].id;
          this.previewContentConnectorIds.push(newConnectorId);
        }
      }
    } else {
      for (const connectorDTO of connectorDTOs) {
        const diagram = await this.addConnectorFn(this.diagramId, connectorDTO);
        if (diagram && diagram.connectors.length > 0) {
          const newConnectorId = diagram.connectors[diagram.connectors.length - 1].id;
          this.previewContentConnectorIds.push(newConnectorId);
        }
      }
    }

    // Create the preview container shape with metadata
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
      isPreview: false, // The preview container itself is not a preview shape
      data: {
        mermaidSyntax: this.mermaidSyntax,
        generatorShapeId: this.generatorShapeId,
        previewShapeIds: this.previewContentShapeIds,
        previewConnectorIds: this.previewContentConnectorIds,
      },
    };

    const diagram = await this.addShapeFn(this.diagramId, previewShapeData);

    // Store the preview shape ID for undo
    if (diagram && diagram.shapes.length > 0) {
      this.previewShapeId = diagram.shapes[diagram.shapes.length - 1].id;
    } else {
      console.error('[ReplaceWithPreviewCommand] Failed to create preview container');
      throw new Error('Failed to create preview shape');
    }
  }

  async undo(): Promise<void> {
    if (!this.previewShapeId || !this.generatorShapeData) {
      console.warn('Cannot undo ReplaceWithPreviewCommand: missing data');
      return;
    }

    // Delete the preview container shape
    await this.deleteShapeFn(this.diagramId, this.previewShapeId);

    // Delete all preview content connectors
    for (const connectorId of this.previewContentConnectorIds) {
      await this.deleteConnectorFn(this.diagramId, connectorId);
    }

    // Delete all preview content shapes
    for (const shapeId of this.previewContentShapeIds) {
      await this.deleteShapeFn(this.diagramId, shapeId);
    }

    // Restore the generator shape
    await this.addShapeFn(this.diagramId, this.generatorShapeData);
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
        x: this.generatorPosition.x,
        y: this.generatorPosition.y,
        width: DESIGN_STUDIO_CONFIG.shapes.preview.width,
        height: DESIGN_STUDIO_CONFIG.shapes.preview.height,
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
