/**
 * Connector Toolset Popover Component
 *
 * Displays a popover with connector types when the user clicks the connector toolbar button
 * or right-clicks on an existing connector.
 */

import { useEffect, useRef } from 'react';
import type { ConnectorTool } from '../../config/bpmn-connectors';

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
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the popover
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Small delay to prevent immediate close from the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConnectorClick = (connectorTool: ConnectorTool) => {
    onConnectorSelect(connectorTool);
    onClose();
  };

  // Prevent context menu on the popover itself
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={menuRef}
      onContextMenu={handleContextMenu}
      className="fixed bg-[var(--bg-light)] border border-[var(--border)] rounded-sm [box-shadow:var(--shadow)] p-2 z-50"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
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
    </div>
  );
}
