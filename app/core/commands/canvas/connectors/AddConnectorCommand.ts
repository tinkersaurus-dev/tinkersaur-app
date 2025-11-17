import type { Command } from '../../command.types';
import type { CreateConnectorDTO } from '../../../entities/design-studio/types/Connector';
import type { Diagram } from '../../../entities/design-studio/types';

/**
 * Command to add a connector to a diagram
 * Stores the connector data and provides functions to add/remove it
 */
export class AddConnectorCommand implements Command {
  public readonly description: string;
  private connectorId: string | null = null;

  constructor(
    private readonly diagramId: string,
    private readonly connectorData: CreateConnectorDTO,
    private readonly addConnectorFn: (diagramId: string, connectorData: CreateConnectorDTO) => Promise<Diagram | null>,
    private readonly deleteConnectorFn: (diagramId: string, connectorId: string) => Promise<Diagram | null>
  ) {
    this.description = `Add connector from ${connectorData.sourceShapeId} to ${connectorData.targetShapeId}`;
  }

  async execute(): Promise<void> {
    const diagram = await this.addConnectorFn(this.diagramId, this.connectorData);

    // Store the generated connector ID for undo
    // The newly added connector is the last one in the array
    if (diagram && diagram.connectors.length > 0) {
      this.connectorId = diagram.connectors[diagram.connectors.length - 1].id;
    }
  }

  async undo(): Promise<void> {
    if (!this.connectorId) {
      console.warn('Cannot undo AddConnectorCommand: connector ID not found');
      return;
    }

    await this.deleteConnectorFn(this.diagramId, this.connectorId);
  }

  /**
   * Get the ID of the connector that was added (available after execute)
   */
  getConnectorId(): string | null {
    return this.connectorId;
  }
}
