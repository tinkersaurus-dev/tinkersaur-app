import type { Command } from '../../model/command.types';
import type { Shape, CreateShapeDTO } from '@/entities/shape';
import type { Connector, CreateConnectorDTO } from '@/entities/connector';
import type { Diagram, DiagramType } from '@/entities/diagram';
import type { SuggestionCommentShapeData } from '@/entities/shape';
import type { LLMPreviewShapeData } from '@/entities/shape';
import type { MermaidImportResult, MermaidShapeRef } from '@/features/diagram-rendering/shared/mermaid/importer';
import { getMermaidExporter } from '@/features/diagram-rendering/shared/mermaid/registry';
import { getMermaidImporter } from '@/features/diagram-rendering/shared/mermaid/registry';
import { applySuggestion } from '@/features/llm-generation';
import { isSuggestionCommentShapeData } from '@/entities/shape';

/**
 * Command to apply a suggestion to a target shape by:
 * 1. Exporting target shape to mermaid
 * 2. Calling LLM with suggestion to get updated mermaid
 * 3. Creating a preview with the updated shapes
 * 4. Reconnecting existing connectors to the primary new shape
 * 5. Deleting the suggestion shape
 *
 * All operations are undoable.
 */
export class ApplySuggestionCommand implements Command {
  public readonly description = 'Apply suggestion';

  // State for undo
  private targetShape: Shape | null = null;
  private suggestionShape: Shape | null = null;
  private suggestionConnector: Connector | null = null;
  private targetConnectors: Connector[] = [];
  private previewShapeId: string | null = null;
  private previewContentShapeIds: string[] = [];
  private previewContentConnectorIds: string[] = [];
  private reconnectedConnectorIds: string[] = [];

  constructor(
    private readonly diagramId: string,
    private readonly diagramType: DiagramType,
    private readonly suggestionShapeId: string,
    private readonly teamId: string,
    private readonly getShapeFn: (diagramId: string, shapeId: string) => Promise<Shape | null>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly addShapeFn: (diagramId: string, shapeData: CreateShapeDTO) => Promise<Diagram>,
    private readonly getDiagramFn: (diagramId: string) => Diagram | undefined,
    private readonly deleteConnectorFn: (diagramId: string, connectorId: string) => Promise<Diagram | null>,
    private readonly addConnectorFn: (diagramId: string, connectorData: CreateConnectorDTO) => Promise<Diagram | null>,
    private readonly addShapesBatchFn?: (diagramId: string, shapes: CreateShapeDTO[]) => Promise<Diagram>,
    private readonly addConnectorsBatchFn?: (diagramId: string, connectors: CreateConnectorDTO[]) => Promise<Diagram | null>
  ) {}

  async execute(): Promise<void> {
    // 1. Get suggestion shape and extract data
    const suggestionShape = await this.getShapeFn(this.diagramId, this.suggestionShapeId);
    if (!suggestionShape) {
      throw new Error('Suggestion shape not found');
    }

    if (!suggestionShape.data || !isSuggestionCommentShapeData(suggestionShape.data)) {
      throw new Error('Invalid suggestion shape data');
    }

    const suggestionData = suggestionShape.data as SuggestionCommentShapeData;
    const targetShapeId = suggestionData.targetShapeId;
    const suggestion = suggestionData.suggestion;

    // 2. Get target shape
    const targetShape = await this.getShapeFn(this.diagramId, targetShapeId);
    if (!targetShape) {
      throw new Error('Target shape not found');
    }
    this.targetShape = targetShape;

    // 3. Get diagram and find connectors connected to target shape
    const diagram = this.getDiagramFn(this.diagramId);
    if (!diagram) {
      throw new Error('Diagram not found');
    }

    this.targetConnectors = diagram.connectors.filter(
      (c) => c.sourceShapeId === targetShapeId || c.targetShapeId === targetShapeId
    );

    // Filter out suggestion connector from target connectors
    this.targetConnectors = this.targetConnectors.filter(
      (c) => c.sourceShapeId !== this.suggestionShapeId
    );

    // 4. Export target shape to mermaid
    const exporterResult = getMermaidExporter(this.diagramType);
    if (!exporterResult.ok) {
      throw new Error(`No exporter for diagram type: ${this.diagramType}`);
    }
    const exporter = exporterResult.value;

    // Get connectors that are between target shape and other shapes (not overlay/suggestion)
    const targetShapeConnectors = this.targetConnectors.filter((c) => !c.overlayTag);

    const exportResult = exporter.export([targetShape], targetShapeConnectors);
    if (!exportResult.ok) {
      throw new Error(`Failed to export target shape: ${exportResult.error}`);
    }
    const targetMermaid = exportResult.value.syntax;

    // 5. Call LLM API to get updated mermaid
    const updatedMermaid = await applySuggestion(
      targetMermaid,
      suggestion,
      this.diagramType,
      this.teamId
    );

    // 6. Parse updated mermaid into shapes
    const importerResult = getMermaidImporter(this.diagramType);
    if (!importerResult.ok) {
      throw new Error(`No importer for diagram type: ${this.diagramType}`);
    }
    const importer = importerResult.value;

    const parseResult = importer.import(updatedMermaid, {
      centerPoint: {
        x: targetShape.x + targetShape.width / 2,
        y: targetShape.y + targetShape.height / 2,
      },
    });

    if (!parseResult.ok) {
      throw new Error(`Failed to parse updated mermaid: ${parseResult.error}`);
    }

    const importResult: MermaidImportResult = parseResult.value;

    if (importResult.shapes.length === 0) {
      throw new Error('LLM returned empty mermaid');
    }

    // 7. Store suggestion shape and connector for undo
    this.suggestionShape = suggestionShape;
    const suggestionConnector = diagram.connectors.find(
      (c) => c.sourceShapeId === this.suggestionShapeId
    );
    if (suggestionConnector) {
      this.suggestionConnector = suggestionConnector;
    }

    // 8. Delete suggestion connector, then suggestion shape
    if (this.suggestionConnector) {
      await this.deleteConnectorFn(this.diagramId, this.suggestionConnector.id);
    }
    await this.deleteShapeFn(this.diagramId, this.suggestionShapeId);

    // 9. Delete target connectors
    for (const connector of this.targetConnectors) {
      await this.deleteConnectorFn(this.diagramId, connector.id);
    }

    // 10. Delete target shape
    await this.deleteShapeFn(this.diagramId, targetShapeId);

    // 11. Create preview shapes from imported mermaid
    const createdShapeIds: string[] = [];
    const shapeDTOs = importResult.shapes.map((shapeData: MermaidShapeRef) => {
      const { parentIndex: _parentIndex, ...rest } = shapeData;
      return {
        ...rest,
        isPreview: true,
      };
    });

    if (this.addShapesBatchFn && shapeDTOs.length > 0) {
      const updatedDiagram = await this.addShapesBatchFn(this.diagramId, shapeDTOs);
      const startIndex = updatedDiagram.shapes.length - shapeDTOs.length;
      for (let i = 0; i < shapeDTOs.length; i++) {
        const newShapeId = updatedDiagram.shapes[startIndex + i].id;
        createdShapeIds.push(newShapeId);
        this.previewContentShapeIds.push(newShapeId);
      }
    } else {
      for (const shapeDTO of shapeDTOs) {
        const updatedDiagram = await this.addShapeFn(this.diagramId, shapeDTO);
        if (updatedDiagram && updatedDiagram.shapes.length > 0) {
          const newShapeId = updatedDiagram.shapes[updatedDiagram.shapes.length - 1].id;
          createdShapeIds.push(newShapeId);
          this.previewContentShapeIds.push(newShapeId);
        }
      }
    }

    // 12. Create preview connectors from import result
    const connectorDTOs: CreateConnectorDTO[] = [];
    for (const connectorRef of importResult.connectors) {
      const fromShapeId = createdShapeIds[connectorRef.fromShapeIndex];
      const toShapeId = createdShapeIds[connectorRef.toShapeIndex];

      if (!fromShapeId || !toShapeId) {
        console.error('[ApplySuggestionCommand] Invalid connector shape indices:', {
          fromShapeIndex: connectorRef.fromShapeIndex,
          toShapeIndex: connectorRef.toShapeIndex,
        });
        continue;
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

    if (this.addConnectorsBatchFn && connectorDTOs.length > 0) {
      const updatedDiagram = await this.addConnectorsBatchFn(this.diagramId, connectorDTOs);
      if (updatedDiagram) {
        const startIndex = updatedDiagram.connectors.length - connectorDTOs.length;
        for (let i = 0; i < connectorDTOs.length; i++) {
          const newConnectorId = updatedDiagram.connectors[startIndex + i].id;
          this.previewContentConnectorIds.push(newConnectorId);
        }
      }
    } else {
      for (const connectorDTO of connectorDTOs) {
        const updatedDiagram = await this.addConnectorFn(this.diagramId, connectorDTO);
        if (updatedDiagram && updatedDiagram.connectors.length > 0) {
          const newConnectorId = updatedDiagram.connectors[updatedDiagram.connectors.length - 1].id;
          this.previewContentConnectorIds.push(newConnectorId);
        }
      }
    }

    // 13. Reconnect existing connectors to primary new shape (first in result)
    const primaryNewShapeId = createdShapeIds[0];

    for (const oldConnector of this.targetConnectors) {
      // Determine new source and target IDs
      const newSourceId = oldConnector.sourceShapeId === targetShapeId
        ? primaryNewShapeId
        : oldConnector.sourceShapeId;
      const newTargetId = oldConnector.targetShapeId === targetShapeId
        ? primaryNewShapeId
        : oldConnector.targetShapeId;

      // Create new connector with updated IDs
      const { id: _id, ...connectorData } = oldConnector;
      const reconnectedConnectorDTO: CreateConnectorDTO = {
        ...connectorData,
        sourceShapeId: newSourceId,
        targetShapeId: newTargetId,
      };

      const updatedDiagram = await this.addConnectorFn(this.diagramId, reconnectedConnectorDTO);
      if (updatedDiagram && updatedDiagram.connectors.length > 0) {
        const newConnectorId = updatedDiagram.connectors[updatedDiagram.connectors.length - 1].id;
        this.reconnectedConnectorIds.push(newConnectorId);
      }
    }

    // 14. Create preview container with LLMPreviewShapeData
    const boundingBox = this.calculateBoundingBox(importResult);

    const previewData: LLMPreviewShapeData = {
      mermaidSyntax: updatedMermaid,
      generatorShapeId: targetShapeId,
      previewShapeIds: this.previewContentShapeIds,
      previewConnectorIds: [...this.previewContentConnectorIds, ...this.reconnectedConnectorIds],
    };

    const previewShapeDTO: CreateShapeDTO = {
      type: 'llm-preview',
      x: boundingBox.x - 20,
      y: boundingBox.y - 20,
      width: boundingBox.width + 40,
      height: boundingBox.height + 40,
      label: undefined,
      zIndex: 0,
      locked: false,
      isPreview: false,
      data: previewData,
    };

    const previewDiagram = await this.addShapeFn(this.diagramId, previewShapeDTO);
    if (previewDiagram && previewDiagram.shapes.length > 0) {
      this.previewShapeId = previewDiagram.shapes[previewDiagram.shapes.length - 1].id;
    }
  }

  async undo(): Promise<void> {
    // Reverse all operations

    // 1. Delete preview container
    if (this.previewShapeId) {
      await this.deleteShapeFn(this.diagramId, this.previewShapeId);
    }

    // 2. Delete reconnected connectors
    for (const connectorId of this.reconnectedConnectorIds) {
      await this.deleteConnectorFn(this.diagramId, connectorId);
    }

    // 3. Delete preview content connectors
    for (const connectorId of this.previewContentConnectorIds) {
      await this.deleteConnectorFn(this.diagramId, connectorId);
    }

    // 4. Delete preview content shapes
    for (const shapeId of this.previewContentShapeIds) {
      await this.deleteShapeFn(this.diagramId, shapeId);
    }

    // 5. Restore target shape
    if (this.targetShape) {
      const { id: _id, ...shapeData } = this.targetShape;
      const restoreDTO: CreateShapeDTO & { id?: string } = {
        ...shapeData,
        id: this.targetShape.id,
      };
      await this.addShapeFn(this.diagramId, restoreDTO as CreateShapeDTO);
    }

    // 6. Restore target connectors
    for (const connector of this.targetConnectors) {
      const { id: _id, ...connectorData } = connector;
      const restoreDTO: CreateConnectorDTO & { id?: string } = {
        ...connectorData,
        id: connector.id,
      };
      await this.addConnectorFn(this.diagramId, restoreDTO as CreateConnectorDTO);
    }

    // 7. Restore suggestion shape
    if (this.suggestionShape) {
      const { id: _id, ...shapeData } = this.suggestionShape;
      const restoreDTO: CreateShapeDTO & { id?: string } = {
        ...shapeData,
        id: this.suggestionShape.id,
      };
      await this.addShapeFn(this.diagramId, restoreDTO as CreateShapeDTO);
    }

    // 8. Restore suggestion connector
    if (this.suggestionConnector) {
      const { id: _id, ...connectorData } = this.suggestionConnector;
      const restoreDTO: CreateConnectorDTO & { id?: string } = {
        ...connectorData,
        id: this.suggestionConnector.id,
      };
      await this.addConnectorFn(this.diagramId, restoreDTO as CreateConnectorDTO);
    }

    // Reset state
    this.previewShapeId = null;
    this.previewContentShapeIds = [];
    this.previewContentConnectorIds = [];
    this.reconnectedConnectorIds = [];
  }

  /**
   * Calculate bounding box of the imported shapes
   */
  private calculateBoundingBox(importResult: MermaidImportResult): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (importResult.shapes.length === 0 && this.targetShape) {
      return {
        x: this.targetShape.x,
        y: this.targetShape.y,
        width: this.targetShape.width,
        height: this.targetShape.height,
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
}
