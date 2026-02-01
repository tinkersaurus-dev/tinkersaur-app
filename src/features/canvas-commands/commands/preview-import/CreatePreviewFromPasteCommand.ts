import type { Command } from '../../model/command.types';
import type { CreateShapeDTO, UpdateShapeDTO } from '@/entities/shape';
import type { CreateConnectorDTO } from '@/entities/connector';
import type { Diagram, DiagramType } from '@/entities/diagram';
import type { MermaidImportResult } from '@/features/diagram-rendering/shared/mermaid/importer';
import { BpmnMermaidImporter } from '@/features/diagram-rendering/bpmn/mermaid/importer';
import { ClassMermaidImporter } from '@/features/diagram-rendering/class/mermaid/importer';
import { SequenceMermaidImporter} from '@/features/diagram-rendering/sequence/mermaid/importer';
import { ArchitectureMermaidImporter } from '@/features/diagram-rendering/architecture/mermaid/importer';
import { EntityRelationshipMermaidImporter } from '@/features/diagram-rendering/entity-relationship/mermaid/importer';
import { CANVAS_CONFIG } from '@/shared/lib/config/canvas-config';

/**
 * Command to create a preview from pasted mermaid syntax
 * This command:
 * 1. Parses the pasted mermaid syntax using the appropriate importer
 * 2. Creates a preview container shape with metadata
 * 3. Creates all preview shapes and connectors as actual diagram entities (marked with isPreview)
 */
export class CreatePreviewFromPasteCommand implements Command {
  public readonly description: string;
  private previewShapeId: string | null = null;
  private previewContentShapeIds: string[] = [];
  private previewContentConnectorIds: string[] = [];

  constructor(
    private readonly diagramId: string,
    private readonly diagramType: DiagramType,
    private readonly mermaidSyntax: string,
    private readonly pastePosition: { x: number; y: number },
    private readonly addShapeFn: (diagramId: string, shapeData: CreateShapeDTO) => Promise<Diagram>,
    private readonly addConnectorFn: (diagramId: string, connectorData: CreateConnectorDTO) => Promise<Diagram | null>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly deleteConnectorFn: (diagramId: string, connectorId: string) => Promise<Diagram | null>,
    private readonly addShapesBatchFn?: (diagramId: string, shapes: CreateShapeDTO[]) => Promise<Diagram>,
    private readonly addConnectorsBatchFn?: (diagramId: string, connectors: CreateConnectorDTO[]) => Promise<Diagram | null>,
    private readonly updateShapeFn?: (diagramId: string, shapeId: string, updates: Partial<UpdateShapeDTO>) => Promise<Diagram | null>
  ) {
    this.description = 'Create preview from paste';
  }

  async execute(): Promise<void> {
    // Get the appropriate mermaid importer for the diagram type
    const importer = this.getImporter(this.diagramType);
    if (!importer) {
      console.error('[CreatePreviewFromPasteCommand] No importer found for:', this.diagramType);
      throw new Error(`No mermaid importer found for diagram type: ${this.diagramType}`);
    }

    // Parse the mermaid syntax
    const parseResult = importer.import(this.mermaidSyntax, {
      centerPoint: this.pastePosition,
    });

    if (!parseResult.ok) {
      console.error('[CreatePreviewFromPasteCommand] Parse failed:', parseResult.error);
      throw new Error(`Failed to parse mermaid: ${parseResult.error}`);
    }

    const importResult: MermaidImportResult = parseResult.value;

    // Calculate bounding box of the parsed shapes to determine preview size
    const boundingBox = this.calculateBoundingBox(importResult);

    // Track shape IDs by their index in the import result
    const createdShapeIds: string[] = [];

    // Create all preview shapes as actual diagram entities (marked with isPreview)
    // First pass: create shapes without parent relationships
    const shapeDTOs = importResult.shapes.map(shapeData => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { parentIndex, ...rest } = shapeData;
      return {
        ...rest,
        isPreview: true, // Mark as preview to disable interactivity
      };
    });

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

    // Second pass: update parent relationships using parentIndex
    for (let i = 0; i < importResult.shapes.length; i++) {
      const shapeRef = importResult.shapes[i];
      if (shapeRef.parentIndex !== undefined) {
        const parentId = createdShapeIds[shapeRef.parentIndex];
        const shapeId = createdShapeIds[i];
        if (parentId && shapeId) {
          // Update the shape with its parent ID
          await this.updateShapeFn?.(this.diagramId, shapeId, { parentId });
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
        console.error('[CreatePreviewFromPasteCommand] Cannot create connector - invalid shape index:', {
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
        generatorShapeId: '', // No generator shape for paste operation
        previewShapeIds: this.previewContentShapeIds,
        previewConnectorIds: this.previewContentConnectorIds,
      },
    };

    const diagram = await this.addShapeFn(this.diagramId, previewShapeData);

    // Store the preview shape ID for undo
    if (diagram && diagram.shapes.length > 0) {
      this.previewShapeId = diagram.shapes[diagram.shapes.length - 1].id;
    } else {
      console.error('[CreatePreviewFromPasteCommand] Failed to create preview container');
      throw new Error('Failed to create preview shape');
    }
  }

  async undo(): Promise<void> {
    if (!this.previewShapeId) {
      console.warn('Cannot undo CreatePreviewFromPasteCommand: missing preview shape ID');
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
      case 'architecture':
        return new ArchitectureMermaidImporter();
      case 'entity-relationship':
        return new EntityRelationshipMermaidImporter();
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
        x: this.pastePosition.x,
        y: this.pastePosition.y,
        width: CANVAS_CONFIG.shapes.preview.width,
        height: CANVAS_CONFIG.shapes.preview.height,
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
