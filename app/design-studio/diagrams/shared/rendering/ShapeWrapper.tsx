/**
 * ShapeWrapper Component
 *
 * Universal wrapper for all shapes that handles shape-level interactions
 * while allowing internal elements to handle their own interactions.
 *
 * This enables both simple shapes (single interactive element) and complex
 * shapes (multiple interactive sub-elements) to work correctly.
 */

import { forwardRef } from 'react';
import type { Shape } from '~/core/entities/design-studio/types';

interface ShapeWrapperProps {
  shape: Shape;
  isSelected: boolean;
  isHovered: boolean;
  zoom: number;
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  borderRadius?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  hoverPadding?: number; // Extra padding (in px) for hover detection area
  children: React.ReactNode;
  style?: React.CSSProperties;
  onMouseDown?: (e: React.MouseEvent, shapeId: string) => void;
  onMouseEnter?: (e: React.MouseEvent, shapeId: string) => void;
  onMouseLeave?: (e: React.MouseEvent, shapeId: string) => void;
  onDoubleClick?: (shapeId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

/**
 * Check if an element is interactive (button, input, select, textarea, etc.)
 * or is marked with data-interactive attribute
 */
function isInteractiveElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;

  // Check if element or any parent has data-interactive attribute
  let current: HTMLElement | null = element;
  while (current) {
    if (current.hasAttribute('data-interactive')) {
      return true;
    }
    // Check if it's a native interactive element
    const tagName = current.tagName.toLowerCase();
    if (['button', 'input', 'select', 'textarea', 'a'].includes(tagName)) {
      return true;
    }
    // Stop at shape boundary
    if (current.hasAttribute('data-shape-id')) {
      break;
    }
    current = current.parentElement;
  }

  return false;
}

export const ShapeWrapper = forwardRef<HTMLDivElement, ShapeWrapperProps>(function ShapeWrapper({
  shape,
  isSelected,
  zoom,
  borderColor,
  borderWidth,
  backgroundColor,
  borderRadius = 2 / zoom,
  borderStyle = 'solid',
  hoverPadding = 0,
  children,
  style,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onDragOver,
  onDrop,
}, ref) {
  const { id, x, y, width, height } = shape;

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only trigger shape-level mousedown if not clicking on interactive element
    if (!isInteractiveElement(e.target)) {
      onMouseDown?.(e, id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only trigger shape-level double-click if not on interactive element
    if (!isInteractiveElement(e.target)) {
      onDoubleClick?.(id);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    onMouseEnter?.(e, id);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    onMouseLeave?.(e, id);
  };

  return (
    <>
      {/* Invisible hover detection area */}
      {hoverPadding > 0 && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            left: `${x - hoverPadding}px`,
            top: `${y - hoverPadding}px`,
            width: `${width + hoverPadding * 2}px`,
            height: `${height + hoverPadding * 2}px`,
            zIndex: 1,
            pointerEvents: 'auto',
          }}
        />
      )}
      {/* Actual shape */}
      <div
        ref={ref}
        data-shape-id={id}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
          width: `${width}px`,
          //minHeight: `${height}px`,
          zIndex: 1,
          outline: `${borderWidth}px ${borderStyle} ${borderColor}`,
          outlineOffset: `-${borderWidth}px`,
          borderRadius: `${borderRadius}px`,
          backgroundColor,
          cursor: isSelected ? 'move' : 'pointer',
          boxSizing: 'border-box',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          ...style,
        }}
      >
        {children}
      </div>
    </>
  );
});
