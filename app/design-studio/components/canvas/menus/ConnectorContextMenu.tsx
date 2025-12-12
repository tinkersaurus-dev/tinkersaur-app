/**
 * Connector Context Menu Component
 *
 * Displays a context menu with connector types when the user right-clicks on an existing connector.
 * Allows the user to change the connector type inline.
 */

import type { ConnectorTool } from '~/design-studio/diagrams/bpmn/connectors';
import { ToolMenuComponent } from './ToolMenuComponent';

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
  return (
    <ToolMenuComponent<ConnectorTool>
      menuId="connector-context-menu"
      x={x}
      y={y}
      isOpen={isOpen}
      onClose={onClose}
      onToolSelect={onConnectorTypeChange}
      tools={connectorTools}
      currentToolKey={currentConnectorType}
      getToolKey={(tool) => tool.connectorType}
      headerText="Change connector type:"
    />
  );
}
