import type { Command } from '../command.types';
import type { CreateShapeDTO, Shape } from '../../entities/design-studio/types/Shape';
import type { Diagram } from '../../entities/design-studio/types';
import type { Connector, CreateConnectorDTO } from '../../entities/design-studio/types/Connector';
import { isLLMPreviewShapeData } from '../../entities/design-studio/types/Shape';

/**
 * Command to replace a preview shape with a mermaid editor shape
 * This command:
 * 1. Extracts preview shape data including child shape/connector IDs
 * 2. Deletes all preview connectors (cascade)
 * 3. Deletes all preview shapes (cascade)
 * 4. Deletes the preview container shape
 * 5. Creates a mermaid editor shape at the same position with the mermaid syntax
 */
export class ReplaceWithEditorCommand implements Command {
  public readonly description: string;
  private editorShapeId: string | null = null;
  private previewShapeData: CreateShapeDTO | null = null;
  private previewContentShapeIds: string[] = [];
  private previewContentConnectorIds: string[] = [];
  private deletedPreviewShapes: CreateShapeDTO[] = [];
  private deletedPreviewConnectors: Connector[] = [];

  constructor(
    private readonly diagramId: string,
    private readonly previewShapeId: string,
    private readonly mermaidSyntax: string,
    private readonly previewPosition: { x: number; y: number; width: number; height: number },
    private readonly addShapeFn: (diagramId: string, shapeData: CreateShapeDTO) => Promise<Diagram>,
    private readonly addConnectorFn: (diagramId: string, connectorData: CreateConnectorDTO) => Promise<Diagram | null>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly deleteConnectorFn: (diagramId: string, connectorId: string) => Promise<Diagram | null>,
    private readonly getShapeFn: (diagramId: string, shapeId: string) => Promise<Shape | null>,
    private readonly getConnectorFn: (diagramId: string, connectorId: string) => Promise<Connector | null>,
    private readonly deleteShapesBatchFn?: (diagramId: string, shapeIds: string[]) => Promise<Diagram | null>,
    private readonly deleteConnectorsBatchFn?: (diagramId: string, connectorIds: string[]) => Promise<Diagram | null>
  ) {
    this.description = 'Edit mermaid syntax';
  }

  async execute(): Promise<void> {
    // Get preview shape data
    const previewShape = await this.getShapeFn(this.diagramId, this.previewShapeId);

    if (!previewShape) {
      console.error('[ReplaceWithEditorCommand] Preview shape not found');
      throw new Error('Preview shape not found');
    }

    // Store preview shape data for undo (convert Shape to CreateShapeDTO)
    const { id: _id, ...shapeDataForUndo } = previewShape;
    this.previewShapeData = shapeDataForUndo;

    // Extract preview content IDs if this is an LLM preview shape
    if (previewShape.data && isLLMPreviewShapeData(previewShape.data)) {
      this.previewContentShapeIds = previewShape.data.previewShapeIds;
      this.previewContentConnectorIds = previewShape.data.previewConnectorIds;

      // Store the deleted shapes and connectors for undo
      for (const shapeId of this.previewContentShapeIds) {
        const shape = await this.getShapeFn(this.diagramId, shapeId);
        if (shape) {
          const { id: _shapeId, ...shapeData } = shape;
          this.deletedPreviewShapes.push(shapeData);
        }
      }

      for (const connectorId of this.previewContentConnectorIds) {
        const connector = await this.getConnectorFn(this.diagramId, connectorId);
        if (connector) {
          this.deletedPreviewConnectors.push(connector);
        }
      }

      // Delete preview connectors first (before shapes they reference)
      if (this.deleteConnectorsBatchFn && this.previewContentConnectorIds.length > 0) {
        await this.deleteConnectorsBatchFn(this.diagramId, this.previewContentConnectorIds);
      } else {
        for (const connectorId of this.previewContentConnectorIds) {
          await this.deleteConnectorFn(this.diagramId, connectorId);
        }
      }

      // Delete preview shapes
      if (this.deleteShapesBatchFn && this.previewContentShapeIds.length > 0) {
        await this.deleteShapesBatchFn(this.diagramId, this.previewContentShapeIds);
      } else {
        for (const shapeId of this.previewContentShapeIds) {
          await this.deleteShapeFn(this.diagramId, shapeId);
        }
      }
    }

    // Delete the preview container shape
    await this.deleteShapeFn(this.diagramId, this.previewShapeId);

    // Create the mermaid editor shape at a reasonable size
    const editorWidth = 600;
    const editorHeight = Math.max(400, this.previewPosition.height);

    const editorShapeData: CreateShapeDTO = {
      type: 'mermaid-editor',
      subtype: undefined,
      x: this.previewPosition.x + (this.previewPosition.width / 2),
      y: this.previewPosition.y + (this.previewPosition.height / 2),
      width: editorWidth,
      height: editorHeight,
      label: undefined,
      zIndex: 0,
      locked: false,
      isPreview: false,
      data: {
        mermaidSyntax: this.mermaidSyntax,
        previewShapeId: this.previewShapeId,
        error: undefined,
      },
    };

    const diagram = await this.addShapeFn(this.diagramId, editorShapeData);

    // Store the editor shape ID for undo
    if (diagram && diagram.shapes.length > 0) {
      this.editorShapeId = diagram.shapes[diagram.shapes.length - 1].id;
    } else {
      console.error('[ReplaceWithEditorCommand] Failed to create editor shape');
      throw new Error('Failed to create editor shape');
    }
  }

  async undo(): Promise<void> {
    if (!this.editorShapeId || !this.previewShapeData) {
      console.warn('Cannot undo ReplaceWithEditorCommand: missing data');
      return;
    }

    // Delete the editor shape
    await this.deleteShapeFn(this.diagramId, this.editorShapeId);

    // Restore all preview shapes
    for (const shapeData of this.deletedPreviewShapes) {
      await this.addShapeFn(this.diagramId, shapeData);
    }

    // Restore all preview connectors
    for (const connectorData of this.deletedPreviewConnectors) {
      const { id: _connId, ...connData } = connectorData;
      await this.addConnectorFn(this.diagramId, connData);
    }

    // Restore the preview container shape
    await this.addShapeFn(this.diagramId, this.previewShapeData);
  }

  /**
   * Get the ID of the editor shape that was created (available after execute)
   */
  getEditorShapeId(): string | null {
    return this.editorShapeId;
  }
}
