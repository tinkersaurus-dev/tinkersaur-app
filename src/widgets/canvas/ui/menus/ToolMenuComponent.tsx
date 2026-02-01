/**
 * Generic Tool Menu Component
 *
 * A reusable context menu for displaying and selecting tools (shapes, connectors, etc.)
 * Used by ShapeContextMenu and ConnectorContextMenu.
 */

import type { ComponentType } from 'react';
import { ContextMenuWrapper } from './ContextMenuWrapper';

/**
 * Base interface that all tool types must satisfy
 */
export interface BaseTool {
  id: string;
  name: string;
  icon: ComponentType<{ size?: number }>;
}

export interface ToolMenuProps<T extends BaseTool> {
  /** Unique identifier for the menu */
  menuId: string;
  /** X position in screen coordinates */
  x: number;
  /** Y position in screen coordinates */
  y: number;
  /** Whether the menu is visible */
  isOpen: boolean;
  /** Callback when menu should close */
  onClose: () => void;
  /** Callback when a tool is selected */
  onToolSelect: (tool: T) => void;
  /** Available tools to display */
  tools: T[];
  /** Current tool key for highlighting */
  currentToolKey?: string;
  /** Function to extract the comparison key from a tool */
  getToolKey: (tool: T) => string;
  /** Header text displayed above the tools */
  headerText: string;
  /** Minimum number of tools required to show the menu (default: 1) */
  minToolsToShow?: number;
}

export function ToolMenuComponent<T extends BaseTool>({
  menuId,
  x,
  y,
  isOpen,
  onClose,
  onToolSelect,
  tools,
  currentToolKey,
  getToolKey,
  headerText,
  minToolsToShow = 1,
}: ToolMenuProps<T>) {
  const handleToolClick = (tool: T) => {
    onToolSelect(tool);
    onClose();
  };

  // Don't render if there aren't enough tools
  if (tools.length < minToolsToShow) {
    return null;
  }

  return (
    <ContextMenuWrapper
      menuId={menuId}
      isOpen={isOpen}
      x={x}
      y={y}
      onClose={onClose}
      className="bg-[var(--bg-light)] border border-[var(--border)] rounded-sm [box-shadow:var(--shadow)] p-2"
    >
      {/* Header */}
      <div className="text-xs text-[var(--text-muted)] px-2 py-1 mb-1">
        {headerText}
      </div>

      {/* Tools in a single row */}
      <div className="flex gap-1 py-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isCurrent = currentToolKey === getToolKey(tool);

          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool)}
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
