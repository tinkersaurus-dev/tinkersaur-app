import type { Shape } from '~/core/entities/design-studio/types';
import {
  type ResizeHandle,
  ALL_RESIZE_HANDLES,
  getHandlePosition,
  getResizeCursor,
} from '../../../utils/resize';

interface ResizeHandlesProps {
  shape: Shape;
  zoom: number;
  onResizeStart: (shapeId: string, handle: ResizeHandle, e: React.MouseEvent) => void;
}

/**
 * Renders 8 resize handles around a selected container shape
 * Handles are positioned at corners and edge midpoints
 */
export function ResizeHandles({ shape, zoom, onResizeStart }: ResizeHandlesProps) {
  // Handle size in pixels (constant visual size regardless of zoom)
  const handleSize = 8;
  const scaledSize = handleSize / zoom;
  const halfSize = scaledSize / 2;

  // Border width scales with zoom for consistent appearance
  const borderWidth = 1 / zoom;

  return (
    <>
      {ALL_RESIZE_HANDLES.map((handle) => {
        const position = getHandlePosition(handle);
        const cursor = getResizeCursor(handle);

        // Calculate handle position relative to shape
        const x = shape.x + position.x * shape.width - halfSize;
        const y = shape.y + position.y * shape.height - halfSize;

        return (
          <div
            key={handle}
            className="absolute"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${scaledSize}px`,
              height: `${scaledSize}px`,
              backgroundColor: 'white',
              border: `${borderWidth}px solid var(--canvas-shape-border-selected)`,
              cursor,
              // Ensure handles are above shapes
              zIndex: 9999,
              // Prevent text selection during drag
              userSelect: 'none',
              // Make the hit target slightly larger for easier grabbing
              boxSizing: 'border-box',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart(shape.id, handle, e);
            }}
          />
        );
      })}
    </>
  );
}
