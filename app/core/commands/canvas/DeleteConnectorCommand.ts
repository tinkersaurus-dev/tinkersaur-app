import type { Command } from '../command.types';
import type { Connector } from '../../entities/design-studio/types/Connector';
import type { Diagram } from '../../entities/design-studio/types';

/**
 * Command to delete a connector from a diagram
 * Stores the complete connector data for restoration on undo
 */
export class DeleteConnectorCommand implements Command {
  public readonly description: string;
  private deletedConnector: Connector | null = null;

  constructor(
    private readonly diagramId: string,
    private readonly connectorId: string,
    private readonly getConnectorFn: (diagramId: string, connectorId: string) => Promise<Connector | null>,
    private readonly deleteConnectorFn: (diagramId: string, connectorId: string) => Promise<Diagram | null>,
    private readonly restoreConnectorFn: (diagramId: string, connector: Connector) => Promise<Diagram | null>
  ) {
    this.description = 'Delete connector';
  }

  async execute(): Promise<void> {
    // Capture the connector before deleting
    this.deletedConnector = await this.getConnectorFn(this.diagramId, this.connectorId);

    if (!this.deletedConnector) {
      console.warn(`Cannot delete connector: connector ${this.connectorId} not found`);
      return;
    }

    await this.deleteConnectorFn(this.diagramId, this.connectorId);
  }

  async undo(): Promise<void> {
    if (!this.deletedConnector) {
      console.warn('Cannot undo DeleteConnectorCommand: deleted connector not found');
      return;
    }

    // Restore the connector with its original ID and all properties preserved
    await this.restoreConnectorFn(this.diagramId, this.deletedConnector);
  }

  /**
   * Get the deleted connector data (available after execute)
   */
  getDeletedConnector(): Connector | null {
    return this.deletedConnector;
  }
}
