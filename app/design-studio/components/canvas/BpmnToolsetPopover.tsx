/**
 * BPMN Toolset Popover Component
 *
 * Displays a popover with BPMN tools when the user right-clicks on the canvas.
 * Tools are organized by type (Tasks, Events, Gateways) in rows with icon buttons.
 */

import { bpmnToolGroups, type Tool } from '../../config/bpmn-tools';
import type { DrawingConnector } from '../../hooks/useInteractionState';
import { ContextMenuWrapper } from './menus/ContextMenuWrapper';

interface BpmnToolsetPopoverProps {
  /** X position in screen coordinates */
  x: number;
  /** Y position in screen coordinates */
  y: number;
  /** X position in canvas coordinates where shape should be created */
  canvasX: number;
  /** Y position in canvas coordinates where shape should be created */
  canvasY: number;
  /** Whether the popover is visible */
  isOpen: boolean;
  /** Callback when popover should close */
  onClose: () => void;
  /** Callback when a tool is selected */
  onToolSelect: (tool: Tool, canvasX: number, canvasY: number) => void;
  /** Active drawing connector (if user is drawing a connector) */
  drawingConnector?: DrawingConnector | null;
}

export function BpmnToolsetPopover({
  x,
  y,
  canvasX,
  canvasY,
  isOpen,
  onClose,
  onToolSelect,
  drawingConnector,
}: BpmnToolsetPopoverProps) {
  const handleToolClick = (tool: Tool) => {
    onToolSelect(tool, canvasX, canvasY);
    onClose();
  };

  return (
    <ContextMenuWrapper
      menuId="bpmn-toolset-popover"
      isOpen={isOpen}
      x={x}
      y={y}
      onClose={onClose}
      className="bg-[var(--bg-light)] border border-[var(--border)] rounded-sm [box-shadow:var(--shadow)] p-2"
    >
      {/* Dynamic tool groups */}
      <div className="flex flex-col gap-0">
        {bpmnToolGroups.map((group, groupIndex) => (
          <div key={group.type}>
            {/* Tool row */}
            <div className="flex gap-1 py-1">
              {group.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 flex items-center justify-center text-[var(--text)] hover:bg-[var(--highlight)] rounded-sm transition-colors duration-[var(--transition-fast)] cursor-pointer border-0 bg-transparent"
                    title={tool.name}
                    aria-label={tool.name}
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>

            {/* Divider between groups (except after last group) */}
            {groupIndex < bpmnToolGroups.length - 1 && (
              <div className="h-px bg-[var(--border-muted)] my-1" />
            )}
          </div>
        ))}
      </div>

      {/* Optional: Display hint if drawing connector */}
      {drawingConnector && (
        <div className="mt-2 pt-2 border-t border-[var(--border-muted)] text-xs text-[var(--text-muted)]">
          Creating connection from {drawingConnector.fromShapeId}
        </div>
      )}
    </ContextMenuWrapper>
  );
}
