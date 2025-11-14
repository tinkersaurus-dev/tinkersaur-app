/**
 * Connector Toolset Popover Component
 *
 * Displays a popover with connector types when the user clicks the connector toolbar button
 * or right-clicks on an existing connector.
 */

import type { ConnectorTool } from '../../../../config/bpmn-connectors';
import { ContextMenuWrapper } from '../ContextMenuWrapper';

interface ConnectorToolsetPopoverProps {
  /** X position in screen coordinates */
  x: number;
  /** Y position in screen coordinates */
  y: number;
  /** Whether the popover is visible */
  isOpen: boolean;
  /** Callback when popover should close */
  onClose: () => void;
  /** Callback when a connector type is selected */
  onConnectorSelect: (connectorTool: ConnectorTool) => void;
  /** Available connector tools for the current diagram type */
  connectorTools: ConnectorTool[];
  /** Currently active connector type ID (for highlighting) */
  activeConnectorType?: string;
}

export function ConnectorToolsetPopover({
  x,
  y,
  isOpen,
  onClose,
  onConnectorSelect,
  connectorTools,
  activeConnectorType,
}: ConnectorToolsetPopoverProps) {
  const handleConnectorClick = (connectorTool: ConnectorTool) => {
    onConnectorSelect(connectorTool);
    onClose();
  };

  return (
    <ContextMenuWrapper
      menuId="connector-toolset-popover"
      isOpen={isOpen}
      x={x}
      y={y}
      onClose={onClose}
      className="bg-[var(--bg-light)] border border-[var(--border)] rounded-sm [box-shadow:var(--shadow)] p-2"
    >
      {/* Connector tools in a single row */}
      <div className="flex gap-1 py-1">
        {connectorTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeConnectorType === tool.connectorType;

          return (
            <button
              key={tool.id}
              onClick={() => handleConnectorClick(tool)}
              className={`w-6 h-6 min-w-[24px] min-h-[24px] p-0 flex items-center justify-center text-[var(--text)] hover:bg-[var(--highlight)] rounded-sm transition-colors duration-[var(--transition-fast)] cursor-pointer border-0 ${
                isActive ? 'bg-[var(--highlight)]' : 'bg-transparent'
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
