import type { Command } from '../../model/command.types';
import type { CreateShapeDTO, Shape, UpdateShapeDTO } from '@/entities/shape';
import type { CreateConnectorDTO } from '@/entities/connector';
import type { Diagram, DiagramType } from '@/entities/diagram';
import { getMermaidImporter } from '@/shared/lib/mermaid';
import type { MermaidImportResult } from '@/shared/lib/mermaid';
import { isLLMPreviewShapeData } from '@/entities/shape';
import { CANVAS_CONFIG } from '@/shared/lib/config/canvas-config';

/**
 * Command to update a preview shape from a mermaid editor shape
 * This command:
 * 1. Parses the updated mermaid syntax using the appropriate importer
 * 2. Deletes the editor shape
 * 3. Deletes old preview shapes/connectors if they exist
 * 4. Creates new preview shapes and connectors as diagram entities (marked with isPreview)
 * 5. Creates an updated preview container shape with the correct data structure
 */
export class UpdatePreviewCommand implements Command {
  public readonly description: string;
  private previewShapeId: string | null = null;
  private previewContentShapeIds: string[] = [];
  private previewContentConnectorIds: string[] = [];
  private editorShapeData: CreateShapeDTO | null = null;
  private oldPreviewShapeId: string | null = null;
  private oldPreviewContentShapeIds: string[] = [];
  private oldPreviewContentConnectorIds: string[] = [];

  constructor(
    private readonly diagramId: string,
    private readonly diagramType: DiagramType,
    private readonly editorShapeId: string,
    private readonly updatedMermaidSyntax: string,
    private readonly editorPosition: { x: number; y: number; width: number; height: number },
    private readonly originalGeneratorShapeId: string,
    private readonly oldPreviewShapeId_param: string | null,
    private readonly addShapeFn: (diagramId: string, shapeData: CreateShapeDTO) => Promise<Diagram>,
    private readonly addConnectorFn: (diagramId: string, connectorData: CreateConnectorDTO) => Promise<Diagram | null>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly deleteConnectorFn: (diagramId: string, connectorId: string) => Promise<Diagram | null>,
    private readonly getShapeFn: (diagramId: string, shapeId: string) => Promise<Shape | null>,
    private readonly addShapesBatchFn?: (diagramId: string, shapes: CreateShapeDTO[]) => Promise<Diagram>,
    private readonly addConnectorsBatchFn?: (diagramId: string, connectors: CreateConnectorDTO[]) => Promise<Diagram | null>,
    private readonly deleteShapesBatchFn?: (diagramId: string, shapeIds: string[]) => Promise<Diagram | null>,
    private readonly deleteConnectorsBatchFn?: (diagramId: string, connectorIds: string[]) => Promise<Diagram | null>,
    private readonly updateShapeFn?: (diagramId: string, shapeId: string, updates: Partial<UpdateShapeDTO>) => Promise<Diagram | null>
  ) {
    this.description = 'Update diagram preview';
    this.oldPreviewShapeId = oldPreviewShapeId_param;
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
    const editorShape = await this.getShapeFn(this.diagramId, this.editorShapeId);
    if (editorShape) {
      const { id: _id, ...shapeData } = editorShape;
      this.editorShapeData = shapeData;
    }

    // Delete the editor shape
    await this.deleteShapeFn(this.diagramId, this.editorShapeId);

    // If there's an old preview shape, delete its content first
    if (this.oldPreviewShapeId) {
      const oldPreviewShape = await this.getShapeFn(this.diagramId, this.oldPreviewShapeId);
      if (oldPreviewShape && oldPreviewShape.data && isLLMPreviewShapeData(oldPreviewShape.data)) {
        this.oldPreviewContentShapeIds = oldPreviewShape.data.previewShapeIds;
        this.oldPreviewContentConnectorIds = oldPreviewShape.data.previewConnectorIds;

        // Delete old preview connectors
        if (this.deleteConnectorsBatchFn && this.oldPreviewContentConnectorIds.length > 0) {
          await this.deleteConnectorsBatchFn(this.diagramId, this.oldPreviewContentConnectorIds);
        } else {
          for (const connectorId of this.oldPreviewContentConnectorIds) {
            await this.deleteConnectorFn(this.diagramId, connectorId);
          }
        }

        // Delete old preview shapes
        if (this.deleteShapesBatchFn && this.oldPreviewContentShapeIds.length > 0) {
          await this.deleteShapesBatchFn(this.diagramId, this.oldPreviewContentShapeIds);
        } else {
          for (const shapeId of this.oldPreviewContentShapeIds) {
            await this.deleteShapeFn(this.diagramId, shapeId);
          }
        }

        // Delete old preview container
        await this.deleteShapeFn(this.diagramId, this.oldPreviewShapeId);
      }
    }

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
    const connectorDTOs: CreateConnectorDTO[] = [];
    for (const connectorRef of importResult.connectors) {
      // Look up the actual shape IDs using the indices
      const fromShapeId = createdShapeIds[connectorRef.fromShapeIndex];
      const toShapeId = createdShapeIds[connectorRef.toShapeIndex];

      if (!fromShapeId || !toShapeId) {
        console.error('[UpdatePreviewCommand] Cannot create connector - invalid shape index:', {
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

    // Create the preview container shape with correct data structure
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
        mermaidSyntax: this.updatedMermaidSyntax,
        generatorShapeId: this.originalGeneratorShapeId,
        previewShapeIds: this.previewContentShapeIds,
        previewConnectorIds: this.previewContentConnectorIds,
      },
    };

    const diagram = await this.addShapeFn(this.diagramId, previewShapeData);

    // Store the preview shape ID for undo
    if (diagram && diagram.shapes.length > 0) {
      this.previewShapeId = diagram.shapes[diagram.shapes.length - 1].id;
    } else {
      console.error('[UpdatePreviewCommand] Failed to create preview container');
      throw new Error('Failed to create preview shape');
    }
  }

  async undo(): Promise<void> {
    if (!this.previewShapeId || !this.editorShapeData) {
      console.warn('Cannot undo UpdatePreviewCommand: missing data');
      return;
    }

    // Delete the preview container shape
    await this.deleteShapeFn(this.diagramId, this.previewShapeId);

    // Delete all preview content connectors
    if (this.deleteConnectorsBatchFn && this.previewContentConnectorIds.length > 0) {
      await this.deleteConnectorsBatchFn(this.diagramId, this.previewContentConnectorIds);
    } else {
      for (const connectorId of this.previewContentConnectorIds) {
        await this.deleteConnectorFn(this.diagramId, connectorId);
      }
    }

    // Delete all preview content shapes
    if (this.deleteShapesBatchFn && this.previewContentShapeIds.length > 0) {
      await this.deleteShapesBatchFn(this.diagramId, this.previewContentShapeIds);
    } else {
      for (const shapeId of this.previewContentShapeIds) {
        await this.deleteShapeFn(this.diagramId, shapeId);
      }
    }

    // Restore the editor shape
    await this.addShapeFn(this.diagramId, this.editorShapeData);

    // If there was an old preview, restore it
    // Note: This is complex and would require storing all the old preview data
    // For now, we'll just restore the editor shape
  }

  private getImporter(diagramType: DiagramType) {
    const result = getMermaidImporter(diagramType);
    return result.ok ? result.value : null;
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
