import type { Command } from '../../model/command.types';
import type { Connector, UpdateConnectorDTO } from '@/entities/connector';
import type { Diagram } from '@/entities/diagram';

/**
 * Command to change a connector's type (and associated visual properties)
 * Stores the previous state for undo
 */
export class ChangeConnectorTypeCommand implements Command {
  public readonly description: string;
  private previousConnectorState: Partial<Connector> | null = null;

  constructor(
    private readonly diagramId: string,
    private readonly connectorId: string,
    private readonly newConnectorData: UpdateConnectorDTO,
    private readonly updateConnectorFn: (diagramId: string, connectorId: string, updates: UpdateConnectorDTO) => Promise<Diagram | null>,
    private readonly getCurrentConnectorFn: (diagramId: string, connectorId: string) => Connector | null,
    private readonly updateLocalConnectorFn?: (connectorId: string, updates: Partial<Connector>) => void
  ) {
    this.description = `Change connector type to ${newConnectorData.type || 'unknown'}`;
  }

  async execute(): Promise<void> {
    // Store the current state for undo
    const currentConnector = this.getCurrentConnectorFn(this.diagramId, this.connectorId);
    if (currentConnector) {
      this.previousConnectorState = {
        type: currentConnector.type,
        style: currentConnector.style,
        markerStart: currentConnector.markerStart,
        markerEnd: currentConnector.markerEnd,
        lineType: currentConnector.lineType,
      };
    }

    // Apply the new connector data to entity store
    await this.updateConnectorFn(this.diagramId, this.connectorId, this.newConnectorData);

    // Update local canvas state immediately for visual feedback
    this.updateLocalConnectorFn?.(this.connectorId, {
      type: this.newConnectorData.type,
      style: this.newConnectorData.style,
      markerStart: this.newConnectorData.markerStart,
      markerEnd: this.newConnectorData.markerEnd,
      lineType: this.newConnectorData.lineType,
    });
  }

  async undo(): Promise<void> {
    if (!this.previousConnectorState) {
      console.warn('Cannot undo ChangeConnectorTypeCommand: previous state not found');
      return;
    }

    // Restore the previous state in entity store
    await this.updateConnectorFn(this.diagramId, this.connectorId, {
      id: this.connectorId,
      ...this.previousConnectorState,
    });

    // Update local canvas state immediately for visual feedback
    this.updateLocalConnectorFn?.(this.connectorId, this.previousConnectorState);
  }
}
