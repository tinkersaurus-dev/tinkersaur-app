import type { Command } from '../../command.types';
import type { Connector } from '../../../entities/design-studio/types/Connector';
import type { Diagram } from '../../../entities/design-studio/types';

export class UpdateConnectorLabelCommand implements Command {
  public readonly description: string;

  constructor(
    private readonly diagramId: string,
    private readonly connectorId: string,
    private readonly oldLabel: string | undefined,
    private readonly newLabel: string | undefined,
    private readonly updateConnectorFn: (
      diagramId: string,
      connectorId: string,
      updates: Partial<Connector>
    ) => Promise<Diagram | null>,
    private readonly updateLocalConnectorFn?: (
      connectorId: string,
      updates: Partial<Connector>
    ) => void
  ) {
    const oldText = oldLabel || '(empty)';
    const newText = newLabel || '(empty)';
    this.description = `Edit connector label: "${oldText}" → "${newText}"`;
  }

  async execute(): Promise<void> {
    await this.updateConnectorFn(this.diagramId, this.connectorId, {
      label: this.newLabel,
    });

    this.updateLocalConnectorFn?.(this.connectorId, {
      label: this.newLabel,
    });
  }

  async undo(): Promise<void> {
    await this.updateConnectorFn(this.diagramId, this.connectorId, {
      label: this.oldLabel,
    });

    this.updateLocalConnectorFn?.(this.connectorId, {
      label: this.oldLabel,
    });
  }
}
