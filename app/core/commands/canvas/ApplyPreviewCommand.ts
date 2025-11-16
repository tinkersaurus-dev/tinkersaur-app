import type { Command } from '../command.types';
import type { CreateShapeDTO, Shape } from '../../entities/design-studio/types/Shape';
import type { CreateConnectorDTO, Connector } from '../../entities/design-studio/types/Connector';
import type { Diagram } from '../../entities/design-studio/types';
import type { LLMPreviewShapeData } from '../../entities/design-studio/types/Shape';

/**
 * Command to apply a preview shape by converting it to real shapes and connectors
 * This command:
 * 1. Extracts the shapes and connectors from the preview shape's data
 * 2. Deletes the preview shape
 * 3. Creates all the shapes and connectors as real entities on the canvas
 */
export class ApplyPreviewCommand implements Command {
  public readonly description: string;
  private createdShapeIds: string[] = [];
  private createdConnectorIds: string[] = [];
  private previewShapeData: CreateShapeDTO | null = null;
  private diagramType: string | null = null;

  constructor(
    private readonly diagramId: string,
    private readonly previewShapeId: string,
    private readonly addShapeFn: (diagramId: string, shapeData: CreateShapeDTO) => Promise<Diagram>,
    private readonly addConnectorFn: (diagramId: string, connectorData: CreateConnectorDTO) => Promise<Diagram | null>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly deleteConnectorFn: (diagramId: string, connectorId: string) => Promise<Diagram | null>,
    private readonly getShapeFn: (diagramId: string, shapeId: string) => Promise<Shape | null>,
    private readonly getConnectorFn: (diagramId: string, connectorId: string) => Promise<Connector | null>,
    private readonly addShapesBatchFn?: (diagramId: string, shapes: CreateShapeDTO[]) => Promise<Diagram>,
    private readonly addConnectorsBatchFn?: (diagramId: string, connectors: CreateConnectorDTO[]) => Promise<Diagram | null>,
    private readonly deleteShapesBatchFn?: (diagramId: string, shapeIds: string[]) => Promise<Diagram | null>,
    private readonly deleteConnectorsBatchFn?: (diagramId: string, connectorIds: string[]) => Promise<Diagram | null>,
    private readonly refreshActivationsFn?: (diagramId: string) => Promise<void>,
    private readonly getDiagramFn?: (diagramId: string) => Diagram | null | undefined
  ) {
    this.description = 'Apply diagram';
  }

  async execute(): Promise<void> {
    // Get diagram type for activation box refresh
    if (this.getDiagramFn) {
      const diagram = this.getDiagramFn(this.diagramId);
      this.diagramType = diagram?.type || null;
    }

    // Get the preview shape to extract its data
    const previewShape = await this.getShapeFn(this.diagramId, this.previewShapeId);

    if (!previewShape) {
      console.error('[ApplyPreviewCommand] Preview shape not found');
      throw new Error('Preview shape not found');
    }

    // Store preview shape data for undo (convert Shape to CreateShapeDTO)
    const { id: _id, ...shapeDataForUndo } = previewShape;
    this.previewShapeData = shapeDataForUndo;

    // Extract the preview data and validate it
    const shapeData = previewShape.data;
    if (!shapeData || typeof shapeData !== 'object') {
      console.error('[ApplyPreviewCommand] Invalid preview shape data:', shapeData);
      throw new Error('Invalid preview shape data');
    }

    // Type guard to check if this is LLMPreviewShapeData
    const previewData = shapeData as unknown as LLMPreviewShapeData;

    if (!previewData.previewShapeIds || !previewData.previewConnectorIds) {
      console.error('[ApplyPreviewCommand] Invalid preview shape data:', previewData);
      throw new Error('Invalid preview shape data');
    }

    // Update all preview shapes to remove the isPreview flag (make them interactive)
    // We need to delete and re-create them to update the isPreview property
    // Build a mapping from old preview shape IDs to new applied shape IDs
    const shapeIdMapping = new Map<string, string>();

    // Step 1: Collect all shape data BEFORE deleting anything
    const shapeDTOs: CreateShapeDTO[] = [];
    const oldShapeIds: string[] = [];

    for (const oldShapeId of previewData.previewShapeIds) {
      const shape = await this.getShapeFn(this.diagramId, oldShapeId);
      if (shape) {
        // Prepare DTO without isPreview flag
        const { id: _id, ...shapeData } = shape;
        const shapeDTO: CreateShapeDTO = {
          ...shapeData,
          isPreview: false,
        };
        shapeDTOs.push(shapeDTO);
        oldShapeIds.push(oldShapeId);
      }
    }

    // Step 2: Collect all connector data BEFORE deleting anything
    // We'll store the connector data with OLD shape IDs, then update them after creating new shapes
    const connectorDataWithOldShapeIds: Array<{
      connectorData: Omit<CreateConnectorDTO, 'sourceShapeId' | 'targetShapeId'>;
      oldSourceShapeId: string;
      oldTargetShapeId: string;
    }> = [];

    for (const oldConnectorId of previewData.previewConnectorIds) {
      const connector = await this.getConnectorFn(this.diagramId, oldConnectorId);
      if (connector) {
        const { id: _id, sourceShapeId, targetShapeId, ...connectorData } = connector;
        connectorDataWithOldShapeIds.push({
          connectorData,
          oldSourceShapeId: sourceShapeId,
          oldTargetShapeId: targetShapeId,
        });
      }
    }

    // Step 3: Delete all old connectors FIRST (before deleting shapes they reference)
    if (this.deleteConnectorsBatchFn && previewData.previewConnectorIds.length > 0) {
      await this.deleteConnectorsBatchFn(this.diagramId, previewData.previewConnectorIds);
    } else {
      for (const oldConnectorId of previewData.previewConnectorIds) {
        await this.deleteConnectorFn(this.diagramId, oldConnectorId);
      }
    }

    // Step 4: Delete the preview container shape and all preview shapes
    const shapeIdsToDelete = [this.previewShapeId, ...oldShapeIds];

    if (this.deleteShapesBatchFn && shapeIdsToDelete.length > 0) {
      await this.deleteShapesBatchFn(this.diagramId, shapeIdsToDelete);
    } else {
      // Fallback to one-by-one
      await this.deleteShapeFn(this.diagramId, this.previewShapeId);
      for (const oldShapeId of oldShapeIds) {
        await this.deleteShapeFn(this.diagramId, oldShapeId);
      }
    }

    // Step 5: Create new shapes with isPreview=false
    if (this.addShapesBatchFn && shapeDTOs.length > 0) {
      const diagram = await this.addShapesBatchFn(this.diagramId, shapeDTOs);
      const startIndex = diagram.shapes.length - shapeDTOs.length;
      for (let i = 0; i < shapeDTOs.length; i++) {
        const newShapeId = diagram.shapes[startIndex + i].id;
        shapeIdMapping.set(oldShapeIds[i], newShapeId);
        this.createdShapeIds.push(newShapeId);
      }
    } else {
      // Fallback to one-by-one
      for (let i = 0; i < shapeDTOs.length; i++) {
        const diagram = await this.addShapeFn(this.diagramId, shapeDTOs[i]);
        if (diagram.shapes.length > 0) {
          const newShapeId = diagram.shapes[diagram.shapes.length - 1].id;
          shapeIdMapping.set(oldShapeIds[i], newShapeId);
          this.createdShapeIds.push(newShapeId);
        }
      }
    }

    // Step 6: Create new connectors with updated shape IDs
    const connectorDTOs: CreateConnectorDTO[] = [];

    for (const connectorInfo of connectorDataWithOldShapeIds) {
      const newSourceShapeId = shapeIdMapping.get(connectorInfo.oldSourceShapeId);
      const newTargetShapeId = shapeIdMapping.get(connectorInfo.oldTargetShapeId);

      if (!newSourceShapeId || !newTargetShapeId) {
        console.error('[ApplyPreviewCommand] Cannot update connector - shape ID mapping missing:', {
          oldSourceShapeId: connectorInfo.oldSourceShapeId,
          oldTargetShapeId: connectorInfo.oldTargetShapeId,
          newSourceShapeId,
          newTargetShapeId,
        });
        continue; // Skip this connector
      }

      connectorDTOs.push({
        ...connectorInfo.connectorData,
        sourceShapeId: newSourceShapeId,
        targetShapeId: newTargetShapeId,
      });
    }

    // Step 7: Add the new connectors
    if (this.addConnectorsBatchFn && connectorDTOs.length > 0) {
      const diagram = await this.addConnectorsBatchFn(this.diagramId, connectorDTOs);
      if (diagram) {
        const startIndex = diagram.connectors.length - connectorDTOs.length;
        for (let i = 0; i < connectorDTOs.length; i++) {
          const newConnectorId = diagram.connectors[startIndex + i].id;
          this.createdConnectorIds.push(newConnectorId);
        }
      }
    } else {
      // Fallback to one-by-one
      for (const connectorDTO of connectorDTOs) {
        const diagram = await this.addConnectorFn(this.diagramId, connectorDTO);
        if (diagram && diagram.connectors.length > 0) {
          const newConnectorId = diagram.connectors[diagram.connectors.length - 1].id;
          this.createdConnectorIds.push(newConnectorId);
        }
      }
    }

    // Refresh activation boxes for sequence diagrams
    if (this.diagramType === 'sequence' && this.refreshActivationsFn) {
      await this.refreshActivationsFn(this.diagramId);
    }
  }

  async undo(): Promise<void> {
    if (!this.previewShapeData) {
      console.warn('Cannot undo ApplyPreviewCommand: missing preview shape data');
      return;
    }

    // Delete all created connectors (in reverse order)
    for (let i = this.createdConnectorIds.length - 1; i >= 0; i--) {
      await this.deleteConnectorFn(this.diagramId, this.createdConnectorIds[i]);
    }

    // Delete all created shapes (in reverse order)
    for (let i = this.createdShapeIds.length - 1; i >= 0; i--) {
      await this.deleteShapeFn(this.diagramId, this.createdShapeIds[i]);
    }

    // Restore the preview shape
    await this.addShapeFn(this.diagramId, this.previewShapeData);

    // Clear the arrays
    this.createdShapeIds = [];
    this.createdConnectorIds = [];
  }

  /**
   * Get the IDs of shapes and connectors that were created (available after execute)
   */
  getCreatedIds(): { shapeIds: string[]; connectorIds: string[] } {
    return {
      shapeIds: [...this.createdShapeIds],
      connectorIds: [...this.createdConnectorIds],
    };
  }
}
