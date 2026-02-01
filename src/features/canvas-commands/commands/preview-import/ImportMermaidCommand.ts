import type { Command } from '../../model/command.types';
import type { Shape } from '@/entities/shape';
import type { Connector } from '@/entities/connector';
import type { Diagram } from '@/entities/diagram';

/**
 * Command to import shapes and connectors from Mermaid syntax
 * Supports undo by tracking all imported entities
 */
export class ImportMermaidCommand implements Command {
  public readonly description: string;
  private importedShapeIds: string[] = [];
  private importedConnectorIds: string[] = [];

  constructor(
    private readonly diagramId: string,
    private readonly shapes: Shape[],
    private readonly connectors: Connector[],
    private readonly restoreShapesBatchFn: (
      diagramId: string,
      shapes: Shape[]
    ) => Promise<Diagram | null>,
    private readonly deleteShapesBatchFn: (
      diagramId: string,
      shapeIds: string[]
    ) => Promise<Diagram | null>,
    private readonly restoreConnectorsBatchFn: (
      diagramId: string,
      connectors: Connector[]
    ) => Promise<Diagram | null>,
    private readonly deleteConnectorsBatchFn: (
      diagramId: string,
      connectorIds: string[]
    ) => Promise<Diagram | null>
  ) {
    this.description = `Import Mermaid diagram (${shapes.length} shapes, ${connectors.length} connectors)`;
  }

  async execute(): Promise<void> {
    // Import shapes first using restore (which accepts shapes with IDs)
    console.warn('[ImportMermaidCommand] Importing shapes:', this.shapes.map(s => ({ id: s.id, label: s.label })));
    const diagramWithShapes = await this.restoreShapesBatchFn(this.diagramId, this.shapes);
    if (!diagramWithShapes) {
      throw new Error('Failed to import shapes');
    }

    // Track imported shape IDs
    this.importedShapeIds = this.shapes.map((shape) => shape.id);
    console.warn('[ImportMermaidCommand] Imported shape IDs:', this.importedShapeIds);

    // Import connectors using restore (which accepts connectors with IDs)
    console.warn('[ImportMermaidCommand] Importing connectors:', this.connectors.map(c => ({ id: c.id, sourceShapeId: c.sourceShapeId, targetShapeId: c.targetShapeId })));
    const diagramWithConnectors = await this.restoreConnectorsBatchFn(
      this.diagramId,
      this.connectors
    );
    if (!diagramWithConnectors) {
      throw new Error('Failed to import connectors');
    }

    // Track imported connector IDs
    this.importedConnectorIds = this.connectors.map((connector) => connector.id);
  }

  async undo(): Promise<void> {
    if (this.importedShapeIds.length === 0 && this.importedConnectorIds.length === 0) {
      console.warn('Cannot undo ImportMermaidCommand: no imported entities found');
      return;
    }

    // Delete connectors first (to avoid orphaned connectors)
    if (this.importedConnectorIds.length > 0) {
      await this.deleteConnectorsBatchFn(this.diagramId, this.importedConnectorIds);
    }

    // Delete shapes
    if (this.importedShapeIds.length > 0) {
      await this.deleteShapesBatchFn(this.diagramId, this.importedShapeIds);
    }
  }

  /**
   * Get the IDs of shapes that were imported (available after execute)
   */
  getImportedShapeIds(): string[] {
    return [...this.importedShapeIds];
  }

  /**
   * Get the IDs of connectors that were imported (available after execute)
   */
  getImportedConnectorIds(): string[] {
    return [...this.importedConnectorIds];
  }
}
