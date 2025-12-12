/**
 * Shape Context Menu Component
 *
 * Displays a context menu with shape subtypes when the user right-clicks on a shape.
 * Allows the user to change the shape subtype inline.
 */

import type { ShapeTool } from '~/design-studio/hooks/useShapeSubtypeManager';
import { ContextMenuWrapper } from './ContextMenuWrapper';

interface ShapeContextMenuProps {
  /** X position in screen coordinates */
  x: number;
  /** Y position in screen coordinates */
  y: number;
  /** Whether the menu is visible */
  isOpen: boolean;
  /** Callback when menu should close */
  onClose: () => void;
  /** Callback when a shape subtype is selected */
  onShapeSubtypeChange: (shapeTool: ShapeTool) => void;
  /** Available shape tools (subtypes) for the current shape type */
  shapeTools: ShapeTool[];
  /** Currently selected shape's subtype (for highlighting) */
  currentShapeSubtype?: string;
}

export function ShapeContextMenu({
  x,
  y,
  isOpen,
  onClose,
  onShapeSubtypeChange,
  shapeTools,
  currentShapeSubtype,
}: ShapeContextMenuProps) {
  const handleShapeClick = (shapeTool: ShapeTool) => {
    onShapeSubtypeChange(shapeTool);
    onClose();
  };

  // Don't render if there are no tools or only one tool (nothing to change to)
  if (shapeTools.length <= 1) {
    return null;
  }

  return (
    <ContextMenuWrapper
      menuId="shape-context-menu"
      isOpen={isOpen}
      x={x}
      y={y}
      onClose={onClose}
      className="bg-[var(--bg-light)] border border-[var(--border)] rounded-sm [box-shadow:var(--shadow)] p-2"
    >
      {/* Header */}
      <div className="text-xs text-[var(--text-muted)] px-2 py-1 mb-1">
        Change shape type:
      </div>

      {/* Shape tools in a single row */}
      <div className="flex gap-1 py-1">
        {shapeTools.map((tool) => {
          const Icon = tool.icon;
          const isCurrent = currentShapeSubtype === tool.shapeSubtype;

          return (
            <button
              key={tool.id}
              onClick={() => handleShapeClick(tool)}
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
