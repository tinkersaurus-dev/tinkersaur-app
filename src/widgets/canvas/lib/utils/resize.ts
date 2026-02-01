/**
 * Resize Utility Functions
 *
 * Helper functions for shape resize operations including bounds calculation,
 * constraint enforcement, and cursor styles.
 */

import type { Shape } from '@/entities/shape';
import { snapToGrid } from './canvas';

/**
 * Resize handle positions
 * - Cardinal directions (N, S, E, W) for edge handles
 * - Diagonal directions (NE, NW, SE, SW) for corner handles
 */
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * Dominant axis for aspect-ratio-locked resizing
 * Once determined, this is locked for the duration of the resize operation
 * to prevent discontinuous jumps when crossing the diagonal threshold
 */
export type DominantAxis = 'x' | 'y' | null;

/**
 * Bounds object representing position and dimensions
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Constants
export const MIN_CONTAINER_WIDTH = 100;
export const MIN_CONTAINER_HEIGHT = 80;

/**
 * Check if a handle is a corner handle (locks aspect ratio)
 */
export function isCornerHandle(handle: ResizeHandle): boolean {
  return handle === 'ne' || handle === 'nw' || handle === 'se' || handle === 'sw';
}

/**
 * Get the appropriate cursor style for a resize handle
 */
export function getResizeCursor(handle: ResizeHandle): string {
  switch (handle) {
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'nw':
    case 'se':
      return 'nwse-resize';
  }
}

/**
 * Calculate the minimum bounds required to contain all children of a shape
 * Returns null if the shape has no children
 */
export function getChildrenBounds(shape: Shape, allShapes: Shape[]): Bounds | null {
  if (!shape.children || shape.children.length === 0) {
    return null;
  }

  const childShapes = allShapes.filter((s) => shape.children!.includes(s.id));

  if (childShapes.length === 0) {
    return null;
  }

  // Find the bounding box that contains all children
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const child of childShapes) {
    minX = Math.min(minX, child.x);
    minY = Math.min(minY, child.y);
    maxX = Math.max(maxX, child.x + child.width);
    maxY = Math.max(maxY, child.y + child.height);
  }

  // Add padding around children
  const padding = 10;

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

/**
 * Calculate new bounds based on resize handle being dragged
 *
 * @param originalBounds - The original bounds before resize started
 * @param handle - Which resize handle is being dragged
 * @param deltaX - Mouse movement in X since resize started
 * @param deltaY - Mouse movement in Y since resize started
 * @param childrenBounds - Minimum bounds required to contain children (or null)
 * @param gridSnappingEnabled - Whether to snap to grid
 * @param aspectRatio - Original aspect ratio for corner handles (width/height)
 * @param lockedAxis - Locked dominant axis for corner handles (prevents jumping)
 * @returns New bounds after applying resize
 */
export function calculateResizeBounds(
  originalBounds: Bounds,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  childrenBounds: Bounds | null,
  gridSnappingEnabled: boolean,
  aspectRatio?: number,
  lockedAxis?: DominantAxis
): Bounds {
  let { x, y, width, height } = originalBounds;

  // For corner handles with aspect ratio locking
  if (isCornerHandle(handle) && aspectRatio !== undefined) {
    return calculateAspectRatioLockedBounds(
      originalBounds,
      handle,
      deltaX,
      deltaY,
      childrenBounds,
      gridSnappingEnabled,
      aspectRatio,
      lockedAxis ?? null
    );
  }

  // Apply delta based on which handle is being dragged
  switch (handle) {
    case 'n':
      // North: adjust y and height
      y = originalBounds.y + deltaY;
      height = originalBounds.height - deltaY;
      break;
    case 's':
      // South: adjust height only
      height = originalBounds.height + deltaY;
      break;
    case 'e':
      // East: adjust width only
      width = originalBounds.width + deltaX;
      break;
    case 'w':
      // West: adjust x and width
      x = originalBounds.x + deltaX;
      width = originalBounds.width - deltaX;
      break;
    case 'ne':
      // Northeast: adjust y, height, and width
      y = originalBounds.y + deltaY;
      height = originalBounds.height - deltaY;
      width = originalBounds.width + deltaX;
      break;
    case 'nw':
      // Northwest: adjust x, y, width, and height
      x = originalBounds.x + deltaX;
      y = originalBounds.y + deltaY;
      width = originalBounds.width - deltaX;
      height = originalBounds.height - deltaY;
      break;
    case 'se':
      // Southeast: adjust width and height
      width = originalBounds.width + deltaX;
      height = originalBounds.height + deltaY;
      break;
    case 'sw':
      // Southwest: adjust x, width, and height
      x = originalBounds.x + deltaX;
      width = originalBounds.width - deltaX;
      height = originalBounds.height + deltaY;
      break;
  }

  // Apply grid snapping
  if (gridSnappingEnabled) {
    x = snapToGrid(x);
    y = snapToGrid(y);
    width = snapToGrid(width);
    height = snapToGrid(height);
  }

  // Apply constraints
  return applyConstraints({ x, y, width, height }, handle, originalBounds, childrenBounds);
}

/**
 * Calculate bounds with aspect ratio locked (for corner handles)
 */
function calculateAspectRatioLockedBounds(
  originalBounds: Bounds,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  childrenBounds: Bounds | null,
  gridSnappingEnabled: boolean,
  aspectRatio: number,
  lockedAxis: DominantAxis
): Bounds {
  let { x, y, width, height } = originalBounds;

  // Use the locked axis if available, otherwise calculate based on current delta
  // The axis should be locked externally after initial movement to prevent jumping
  let useXAxis: boolean;
  if (lockedAxis !== null) {
    useXAxis = lockedAxis === 'x';
  } else {
    // Fallback: determine axis based on which delta is larger relative to aspect ratio
    const normalizedDeltaX = Math.abs(deltaX);
    const normalizedDeltaY = Math.abs(deltaY) * aspectRatio;
    useXAxis = normalizedDeltaX >= normalizedDeltaY;
  }

  if (useXAxis) {
    // Use deltaX as primary, calculate height from width
    switch (handle) {
      case 'ne':
        width = originalBounds.width + deltaX;
        height = width / aspectRatio;
        y = originalBounds.y + originalBounds.height - height;
        break;
      case 'nw':
        width = originalBounds.width - deltaX;
        height = width / aspectRatio;
        x = originalBounds.x + originalBounds.width - width;
        y = originalBounds.y + originalBounds.height - height;
        break;
      case 'se':
        width = originalBounds.width + deltaX;
        height = width / aspectRatio;
        break;
      case 'sw':
        width = originalBounds.width - deltaX;
        height = width / aspectRatio;
        x = originalBounds.x + originalBounds.width - width;
        break;
    }
  } else {
    // Use deltaY as primary, calculate width from height
    switch (handle) {
      case 'ne':
        height = originalBounds.height - deltaY;
        width = height * aspectRatio;
        y = originalBounds.y + deltaY;
        break;
      case 'nw':
        height = originalBounds.height - deltaY;
        width = height * aspectRatio;
        x = originalBounds.x + originalBounds.width - width;
        y = originalBounds.y + deltaY;
        break;
      case 'se':
        height = originalBounds.height + deltaY;
        width = height * aspectRatio;
        break;
      case 'sw':
        height = originalBounds.height + deltaY;
        width = height * aspectRatio;
        x = originalBounds.x + originalBounds.width - width;
        break;
    }
  }

  // Apply grid snapping (snap width/height, then recalculate position)
  if (gridSnappingEnabled) {
    width = snapToGrid(width);
    height = snapToGrid(height);

    // Recalculate position based on handle
    switch (handle) {
      case 'ne':
        y = originalBounds.y + originalBounds.height - height;
        break;
      case 'nw':
        x = originalBounds.x + originalBounds.width - width;
        y = originalBounds.y + originalBounds.height - height;
        break;
      case 'se':
        // x and y stay the same
        break;
      case 'sw':
        x = originalBounds.x + originalBounds.width - width;
        break;
    }
  }

  // Apply constraints
  return applyConstraints({ x, y, width, height }, handle, originalBounds, childrenBounds);
}

/**
 * Apply minimum size and children bounds constraints
 */
function applyConstraints(
  bounds: Bounds,
  handle: ResizeHandle,
  originalBounds: Bounds,
  childrenBounds: Bounds | null
): Bounds {
  let { x, y, width, height } = bounds;

  // Determine minimum dimensions
  let minWidth = MIN_CONTAINER_WIDTH;
  let minHeight = MIN_CONTAINER_HEIGHT;
  let _minX = -Infinity;
  let _minY = -Infinity;
  let maxX = Infinity;
  let maxY = Infinity;

  // If there are children, constrain to contain them
  if (childrenBounds) {
    // The container must be large enough to contain children
    minWidth = Math.max(minWidth, childrenBounds.width);
    minHeight = Math.max(minHeight, childrenBounds.height);

    // The container position is also constrained by children
    // Container left edge must be <= leftmost child
    maxX = childrenBounds.x;
    // Container top edge must be <= topmost child
    maxY = childrenBounds.y;
    // Container right edge must be >= rightmost child
    _minX = childrenBounds.x + childrenBounds.width - width;
    // Container bottom edge must be >= bottommost child
    _minY = childrenBounds.y + childrenBounds.height - height;
  }

  // Apply minimum size constraints (anchor depends on handle)
  if (width < minWidth) {
    width = minWidth;
    // Recalculate x based on handle
    if (handle === 'w' || handle === 'nw' || handle === 'sw') {
      x = originalBounds.x + originalBounds.width - minWidth;
    }
  }

  if (height < minHeight) {
    height = minHeight;
    // Recalculate y based on handle
    if (handle === 'n' || handle === 'ne' || handle === 'nw') {
      y = originalBounds.y + originalBounds.height - minHeight;
    }
  }

  // Apply position constraints for child containment
  if (childrenBounds) {
    // Constrain x position
    if (handle === 'w' || handle === 'nw' || handle === 'sw') {
      // When resizing from left, x can't go past children
      if (x > maxX) {
        const constrainedX = maxX;
        width = width + (x - constrainedX);
        x = constrainedX;
      }
    } else if (handle === 'e' || handle === 'ne' || handle === 'se') {
      // When resizing from right, right edge can't go past children
      const rightEdge = x + width;
      const minRightEdge = childrenBounds.x + childrenBounds.width;
      if (rightEdge < minRightEdge) {
        width = minRightEdge - x;
      }
    }

    // Constrain y position
    if (handle === 'n' || handle === 'ne' || handle === 'nw') {
      // When resizing from top, y can't go past children
      if (y > maxY) {
        const constrainedY = maxY;
        height = height + (y - constrainedY);
        y = constrainedY;
      }
    } else if (handle === 's' || handle === 'se' || handle === 'sw') {
      // When resizing from bottom, bottom edge can't go past children
      const bottomEdge = y + height;
      const minBottomEdge = childrenBounds.y + childrenBounds.height;
      if (bottomEdge < minBottomEdge) {
        height = minBottomEdge - y;
      }
    }
  }

  return { x, y, width, height };
}

/**
 * Get handle position relative to shape bounds (as percentages)
 * Returns { x, y } where x and y are 0, 0.5, or 1
 */
export function getHandlePosition(handle: ResizeHandle): { x: number; y: number } {
  switch (handle) {
    case 'nw':
      return { x: 0, y: 0 };
    case 'n':
      return { x: 0.5, y: 0 };
    case 'ne':
      return { x: 1, y: 0 };
    case 'w':
      return { x: 0, y: 0.5 };
    case 'e':
      return { x: 1, y: 0.5 };
    case 'sw':
      return { x: 0, y: 1 };
    case 's':
      return { x: 0.5, y: 1 };
    case 'se':
      return { x: 1, y: 1 };
  }
}

/**
 * All resize handles in order for rendering
 */
export const ALL_RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

/**
 * Threshold in pixels before locking the dominant axis
 * Allows small movements before committing to an axis
 */
const AXIS_LOCK_THRESHOLD = 5;

/**
 * Determine the dominant axis for aspect-ratio-locked resizing
 * Returns null if the movement is below the threshold
 *
 * @param deltaX - Mouse movement in X since resize started
 * @param deltaY - Mouse movement in Y since resize started
 * @param aspectRatio - Original aspect ratio (width/height)
 * @returns 'x', 'y', or null if below threshold
 */
export function determineDominantAxis(
  deltaX: number,
  deltaY: number,
  aspectRatio: number
): DominantAxis {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  // Don't lock until movement exceeds threshold
  if (absX < AXIS_LOCK_THRESHOLD && absY < AXIS_LOCK_THRESHOLD) {
    return null;
  }

  // Normalize deltas by aspect ratio to compare fairly
  const normalizedDeltaX = absX;
  const normalizedDeltaY = absY * aspectRatio;

  return normalizedDeltaX >= normalizedDeltaY ? 'x' : 'y';
}
