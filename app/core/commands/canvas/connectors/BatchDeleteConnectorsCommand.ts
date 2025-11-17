import type { Command } from '../../command.types';
import type { Connector } from '../../../entities/design-studio/types/Connector';
import type { Diagram } from '../../../entities/design-studio/types';

/**
 * Command to delete multiple connectors atomically
 * Stores all connector data for restoration on undo
 * All deletions happen as a single atomic operation
 */
export class BatchDeleteConnectorsCommand implements Command {
  public readonly description: string;
  private deletedConnectors: Map<string, Connector> = new Map();

  constructor(
    private readonly diagramId: string,
    private readonly connectorIds: string[],
    private readonly getConnectorFn: (diagramId: string, connectorId: string) => Promise<Connector | null>,
    private readonly deleteConnectorsBatchFn: (diagramId: string, connectorIds: string[]) => Promise<Diagram | null>,
    private readonly restoreConnectorsBatchFn: (diagramId: string, connectors: Connector[]) => Promise<Diagram | null>
  ) {
    this.description = connectorIds.length === 1 ? 'Delete connector' : `Delete ${connectorIds.length} connectors`;
  }

  async execute(): Promise<void> {
    // Capture all connectors before deleting
    for (const connectorId of this.connectorIds) {
      const connector = await this.getConnectorFn(this.diagramId, connectorId);
      if (connector) {
        this.deletedConnectors.set(connectorId, connector);
      }
    }

    // Delete all connectors in a single batch operation
    if (this.connectorIds.length > 0) {
      await this.deleteConnectorsBatchFn(this.diagramId, this.connectorIds);
    }
  }

  async undo(): Promise<void> {
    if (this.deletedConnectors.size === 0) {
      console.warn('Cannot undo BatchDeleteConnectorsCommand: no connectors were deleted');
      return;
    }

    // Restore all connectors in a single batch operation
    const connectors = Array.from(this.deletedConnectors.values());
    await this.restoreConnectorsBatchFn(this.diagramId, connectors);
  }

  /**
   * Get the deleted connectors data (available after execute)
   */
  getDeletedConnectors(): Connector[] {
    return Array.from(this.deletedConnectors.values());
  }
}
