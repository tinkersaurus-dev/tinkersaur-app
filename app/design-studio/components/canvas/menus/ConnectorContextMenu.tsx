/**
 * Connector Context Menu Component
 *
 * Displays a context menu with connector types when the user right-clicks on an existing connector.
 * Allows the user to change the connector type inline.
 */

import type { ConnectorTool } from '~/design-studio/diagrams/bpmn/connectors';
import { ContextMenuWrapper } from './ContextMenuWrapper';

interface ConnectorContextMenuProps {
  /** X position in screen coordinates */
  x: number;
  /** Y position in screen coordinates */
  y: number;
  /** Whether the menu is visible */
  isOpen: boolean;
  /** Callback when menu should close */
  onClose: () => void;
  /** Callback when a connector type is selected */
  onConnectorTypeChange: (connectorTool: ConnectorTool) => void;
  /** Available connector tools for the current diagram type */
  connectorTools: ConnectorTool[];
  /** Currently selected connector's type (for highlighting) */
  currentConnectorType?: string;
}

export function ConnectorContextMenu({
  x,
  y,
  isOpen,
  onClose,
  onConnectorTypeChange,
  connectorTools,
  currentConnectorType,
}: ConnectorContextMenuProps) {
  const handleConnectorClick = (connectorTool: ConnectorTool) => {
    onConnectorTypeChange(connectorTool);
    onClose();
  };

  return (
    <ContextMenuWrapper
      menuId="connector-context-menu"
      isOpen={isOpen}
      x={x}
      y={y}
      onClose={onClose}
      className="bg-[var(--bg-light)] border border-[var(--border)] rounded-sm [box-shadow:var(--shadow)] p-2"
    >
      {/* Header */}
      <div className="text-xs text-[var(--text-muted)] px-2 py-1 mb-1">
        Change connector type:
      </div>

      {/* Connector tools in a single row */}
      <div className="flex gap-1 py-1">
        {connectorTools.map((tool) => {
          const Icon = tool.icon;
          const isCurrent = currentConnectorType === tool.connectorType;

          return (
            <button
              key={tool.id}
              onClick={() => handleConnectorClick(tool)}
              className={`w-6 h-6 min-w-[24px] min-h-[24px] p-0 flex items-center justify-center text-[var(--text)] hover:bg-[var(--highlight)] rounded-sm transition-colors duration-[var(--transition-fast)] cursor-pointer border-0 ${
                isCurrent ? 'bg-[var(--highlight)]' : 'bg-transparent'
              }`}
              title={tool.name}
              aria-label={tool.name}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    </ContextMenuWrapper>
  );
}
