/**
 * Shape Context Menu Component
 *
 * Displays a context menu with shape subtypes when the user right-clicks on a shape.
 * Allows the user to change the shape subtype inline.
 */

import type { ShapeTool } from '../../lib/hooks/useShapeSubtypeManager';
import { ToolMenuComponent } from './ToolMenuComponent';

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
  return (
    <ToolMenuComponent<ShapeTool>
      menuId="shape-context-menu"
      x={x}
      y={y}
      isOpen={isOpen}
      onClose={onClose}
      onToolSelect={onShapeSubtypeChange}
      tools={shapeTools}
      currentToolKey={currentShapeSubtype}
      getToolKey={(tool) => tool.shapeSubtype ?? tool.shapeType}
      headerText="Change shape type:"
      minToolsToShow={2}
    />
  );
}
