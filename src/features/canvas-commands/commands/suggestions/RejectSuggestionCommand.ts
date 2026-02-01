import type { Command } from '../../model/command.types';
import type { Shape, CreateShapeDTO } from '@/entities/shape';
import type { Connector, CreateConnectorDTO } from '@/entities/connector';
import type { Diagram } from '@/entities/diagram';

/**
 * Command to reject (dismiss) a suggestion by deleting the suggestion shape and its connector
 * This command supports undo/redo to restore the suggestion if needed
 */
export class RejectSuggestionCommand implements Command {
  public readonly description = 'Reject suggestion';

  // State for undo
  private deletedSuggestionShape: Shape | null = null;
  private deletedConnector: Connector | null = null;

  constructor(
    private readonly diagramId: string,
    private readonly suggestionShapeId: string,
    private readonly getShapeFn: (diagramId: string, shapeId: string) => Promise<Shape | null>,
    private readonly deleteShapeFn: (diagramId: string, shapeId: string) => Promise<Diagram | null>,
    private readonly addShapeFn: (diagramId: string, shapeData: CreateShapeDTO) => Promise<Diagram>,
    private readonly getDiagramFn: (diagramId: string) => Diagram | undefined,
    private readonly deleteConnectorFn: (diagramId: string, connectorId: string) => Promise<Diagram | null>,
    private readonly addConnectorFn: (diagramId: string, connectorData: CreateConnectorDTO) => Promise<Diagram | null>
  ) {}

  async execute(): Promise<void> {
    // 1. Get and store the suggestion shape for undo
    const suggestionShape = await this.getShapeFn(this.diagramId, this.suggestionShapeId);
    if (!suggestionShape) {
      throw new Error('Suggestion shape not found');
    }
    this.deletedSuggestionShape = suggestionShape;

    // 2. Find the connector from this suggestion to its target
    const diagram = this.getDiagramFn(this.diagramId);
    if (diagram) {
      const connector = diagram.connectors.find(
        (c) => c.sourceShapeId === this.suggestionShapeId
      );
      if (connector) {
        this.deletedConnector = connector;
      }
    }

    // 3. Delete connector first (cascade safety - delete connector before shape)
    if (this.deletedConnector) {
      await this.deleteConnectorFn(this.diagramId, this.deletedConnector.id);
    }

    // 4. Delete the suggestion shape
    await this.deleteShapeFn(this.diagramId, this.suggestionShapeId);
  }

  async undo(): Promise<void> {
    // 1. Restore the suggestion shape
    if (this.deletedSuggestionShape) {
      const { id: _id, ...shapeData } = this.deletedSuggestionShape;
      // Restore with original ID by including it in the DTO
      const restoreDTO: CreateShapeDTO & { id?: string } = {
        ...shapeData,
        id: this.deletedSuggestionShape.id,
      };
      await this.addShapeFn(this.diagramId, restoreDTO as CreateShapeDTO);
    }

    // 2. Restore the connector
    if (this.deletedConnector) {
      const { id: _id, ...connectorData } = this.deletedConnector;
      const restoreDTO: CreateConnectorDTO & { id?: string } = {
        ...connectorData,
        id: this.deletedConnector.id,
      };
      await this.addConnectorFn(this.diagramId, restoreDTO as CreateConnectorDTO);
    }
  }
}
