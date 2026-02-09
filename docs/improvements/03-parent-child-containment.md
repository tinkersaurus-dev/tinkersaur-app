# Intelligent Parent-Child Containment Improvement

**Priority**: Critical
**Gap Severity**: Major
**Estimated New Code**: ~390 lines

---

## Overview

The VS Code extension has real-time containment detection with visual feedback and circular relationship prevention, while tinkersaur-app only has simple center-point containment checks at drag finish.

### Current State

**Tinkersaur-App:**
```typescript
// Simple check in useShapeDragging finishDragging
for (const group of groups) {
  if (isShapeInsideGroup(shape, group)) {
    newParentGroupId = group.id;
    break;
  }
}
```

**VS Code Extension:**
- Real-time containment detection with visual feedback
- Throttled to 30fps during drag
- Prevents circular relationships
- Finds deepest valid container

---

## Implementation Guide

### 3.1 Containment Utilities

**Create: `app/design-studio/utils/containment-utils.ts`**

```typescript
import type { Shape } from '~/core/entities/design-studio/types/Shape';

/**
 * Check if a shape type can contain other shapes
 */
export function isContainerType(shapeType: string): boolean {
  return (
    shapeType === 'group' ||
    shapeType === 'bpmn-swimlane' ||
    shapeType === 'architecture-group' ||
    shapeType === 'sequence-frame'
  );
}

/**
 * Check if a point is inside a shape's bounds
 */
export function isPointInShape(
  pointX: number,
  pointY: number,
  shape: Shape,
  headerHeight: number = 40
): boolean {
  // For groups/containers, exclude the header area
  const effectiveY = shape.y + (isContainerType(shape.type) ? headerHeight : 0);
  const effectiveHeight = shape.height - (isContainerType(shape.type) ? headerHeight : 0);

  return (
    pointX >= shape.x &&
    pointX <= shape.x + shape.width &&
    pointY >= effectiveY &&
    pointY <= effectiveY + effectiveHeight
  );
}

/**
 * Check if a shape's center is inside another shape
 */
export function isShapeCenterInside(child: Shape, parent: Shape): boolean {
  const centerX = child.x + child.width / 2;
  const centerY = child.y + child.height / 2;

  return isPointInShape(centerX, centerY, parent);
}

/**
 * Get all descendant IDs of a shape (recursive)
 *
 * This is crucial for preventing circular relationships:
 * - A shape cannot become the parent of its own ancestor
 * - We exclude the dragged shape, its descendants, but NOT its current parent
 */
export function getAllDescendantIds(shapeId: string, allShapes: Shape[]): string[] {
  const descendants: string[] = [];

  function collectDescendants(parentId: string) {
    const children = allShapes.filter((s) => s.parentId === parentId);
    for (const child of children) {
      descendants.push(child.id);
      collectDescendants(child.id);
    }
  }

  collectDescendants(shapeId);
  return descendants;
}

/**
 * Find the deepest valid container at a given position
 *
 * Algorithm:
 * 1. Filter for container-type shapes only
 * 2. Exclude shapes in the exclusion set (dragged shape + descendants)
 * 3. Check if shape center is inside each container
 * 4. If multiple containers match, choose the one with smallest area (most specific)
 *
 * @param shape - The shape being dragged
 * @param allShapes - All shapes in the diagram
 * @param excludeIds - Set of shape IDs to exclude (dragged shape + descendants)
 * @returns The deepest valid container, or null if none found
 */
export function findContainerAtPosition(
  shape: Shape,
  allShapes: Shape[],
  excludeIds: Set<string>
): Shape | null {
  // Filter for potential containers
  const potentialContainers = allShapes.filter(
    (s) =>
      isContainerType(s.type) &&
      !excludeIds.has(s.id) &&
      s.id !== shape.id
  );

  // Find all containers that contain the shape's center
  const matchingContainers = potentialContainers.filter((container) =>
    isShapeCenterInside(shape, container)
  );

  if (matchingContainers.length === 0) {
    return null;
  }

  // If multiple containers match, choose the smallest one (most specific)
  // This handles nested containers correctly
  const smallestContainer = matchingContainers.reduce((smallest, current) => {
    const smallestArea = smallest.width * smallest.height;
    const currentArea = current.width * current.height;
    return currentArea < smallestArea ? current : smallest;
  });

  return smallestContainer;
}
```

**Key Algorithm Details:**

1. **Container Type Detection**: Checks shape type against known container types
2. **Header Exclusion**: Subtracts header height from effective bounds
3. **Center Point Logic**: Uses shape center for containment check (more stable than edges)
4. **Descendant Exclusion**: Prevents circular relationships by excluding all descendants
5. **Smallest Container**: When nested, selects the most specific (smallest area) container

---

### 3.2 Throttle Utility

**Create: `app/design-studio/utils/throttle.ts`**

```typescript
/**
 * Throttle function that limits execution rate
 *
 * @param fn - Function to throttle
 * @param delay - Minimum time between executions (in milliseconds)
 * @returns Throttled function with cancel method
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    // Clear any pending timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (timeSinceLastCall >= delay) {
      // Execute immediately if enough time has passed
      lastCall = now;
      fn.apply(this, args);
    } else {
      // Schedule execution for later
      const remainingTime = delay - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
        timeoutId = null;
      }, remainingTime);
    }
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
}
```

---

### 3.3 Integration into useShapeDragging

**Update: `app/design-studio/hooks/useShapeDragging.ts`**

```typescript
import { useRef, useCallback, useEffect, useMemo } from 'react';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import { snapToGrid } from '../utils/canvas';
import type { DragData } from './useInteractionState';
import {
  findContainerAtPosition,
  getAllDescendantIds,
} from '../utils/containment-utils';
import { throttle } from '../utils/throttle';

interface UseShapeDraggingProps {
  // ... existing props
  setHoveredContainerId?: (id: string | null) => void; // NEW: For visual feedback
}

export function useShapeDragging({
  shapes,
  updateShape,
  viewportTransform,
  isActive,
  dragData,
  gridSnappingEnabled,
  setHoveredContainerId, // NEW
}: UseShapeDraggingProps) {
  const shapesStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<Map<string, Partial<Shape>> | null>(null);

  // Throttle containment detection to 30fps (expensive operation, only for visual feedback)
  const throttledContainerDetection = useMemo(
    () =>
      throttle(
        (
          tempShape: Shape,
          shapes: Shape[],
          excludeIds: Set<string>,
          callback: (id: string | null) => void
        ) => {
          const container = findContainerAtPosition(tempShape, shapes, excludeIds);
          callback(container?.id ?? null);
        },
        33 // 30fps
      ),
    []
  );

  const updateDragging = useCallback(
    (screenX: number, screenY: number, _containerRect: DOMRect): { x: number; y: number } => {
      if (!isActive || !dragData) return { x: 0, y: 0 };

      const { x: currentCanvasX, y: currentCanvasY } = viewportTransform.screenToCanvas(
        screenX,
        screenY
      );

      const deltaX = currentCanvasX - dragData.startCanvasPos.x;
      const deltaY = currentCanvasY - dragData.startCanvasPos.y;

      // Build batch update map
      const updates = new Map<string, Partial<Shape>>();
      const draggedShapeIds = Array.from(shapesStartPositionsRef.current.keys());

      shapesStartPositionsRef.current.forEach((startPos, shapeId) => {
        let newX = startPos.x + deltaX;
        let newY = startPos.y + deltaY;

        if (gridSnappingEnabled) {
          newX = snapToGrid(newX);
          newY = snapToGrid(newY);
        }

        updates.set(shapeId, { x: newX, y: newY });
      });

      // Visual feedback: detect which container the primary shape is over
      // Throttled to 30fps since this is expensive and only for visual feedback
      if (setHoveredContainerId && draggedShapeIds.length > 0) {
        const primaryShapeId = draggedShapeIds[0];
        const updatedPosition = updates.get(primaryShapeId);

        if (updatedPosition) {
          const currentShape = shapes.find((s) => s.id === primaryShapeId);
          if (currentShape) {
            // Create temporary shape with updated position
            const tempShape: Shape = {
              ...currentShape,
              x: updatedPosition.x ?? currentShape.x,
              y: updatedPosition.y ?? currentShape.y,
            };

            // Build exclusion set: shape itself + descendants (NOT ancestors - we need to detect current parent)
            const excludeIds = new Set<string>([primaryShapeId]);
            const descendants = getAllDescendantIds(primaryShapeId, shapes);
            descendants.forEach((id) => excludeIds.add(id));

            // Use throttled detection for visual feedback
            throttledContainerDetection(tempShape, shapes, excludeIds, setHoveredContainerId);
          }
        }
      }

      // Store pending updates
      pendingUpdatesRef.current = updates;

      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Schedule update on next animation frame (batches to ~60fps)
      rafIdRef.current = requestAnimationFrame(() => {
        if (pendingUpdatesRef.current) {
          // Apply all updates in one batch
          pendingUpdatesRef.current.forEach((update, shapeId) => {
            updateShape(shapeId, update);
          });
          pendingUpdatesRef.current = null;
        }
        rafIdRef.current = null;
      });

      return { x: deltaX, y: deltaY };
    },
    [isActive, dragData, viewportTransform, gridSnappingEnabled, updateShape, shapes, setHoveredContainerId, throttledContainerDetection]
  );

  const finishDragging = useCallback(() => {
    // Cancel throttled container detection
    throttledContainerDetection.cancel();

    // Clear hovered container visual feedback
    if (setHoveredContainerId) {
      setHoveredContainerId(null);
    }

    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Flush any pending updates immediately
    if (pendingUpdatesRef.current) {
      pendingUpdatesRef.current.forEach((update, shapeId) => {
        updateShape(shapeId, update);
      });
      pendingUpdatesRef.current = null;
    }

    // Update parent-child relationships
    if (dragData) {
      const draggedShapeIds = Array.from(shapesStartPositionsRef.current.keys());

      if (draggedShapeIds.length > 0) {
        const primaryShapeId = draggedShapeIds[0];
        const currentShape = shapes.find((s) => s.id === primaryShapeId);

        if (currentShape) {
          // Build exclusion set
          const excludeIds = new Set<string>([primaryShapeId]);
          const descendants = getAllDescendantIds(primaryShapeId, shapes);
          descendants.forEach((id) => excludeIds.add(id));

          // Find new parent container
          const newContainer = findContainerAtPosition(currentShape, shapes, excludeIds);
          const newParentId = newContainer?.id;

          // Update if parent changed
          if (newParentId !== currentShape.parentId) {
            updateShape(primaryShapeId, { parentId: newParentId });
          }
        }
      }
    }

    shapesStartPositionsRef.current.clear();
  }, [dragData, updateShape, shapes, setHoveredContainerId, throttledContainerDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      throttledContainerDetection.cancel();
    };
  }, [throttledContainerDetection]);

  return {
    startDragging,
    updateDragging,
    finishDragging,
  };
}
```

**Key Implementation Details:**

1. **Throttled Detection**: Runs at 30fps (33ms) during drag for visual feedback only
2. **RAF Batching**: Position updates batched to 60fps using `requestAnimationFrame`
3. **Exclusion Set**: Prevents circular relationships by excluding dragged shape + all descendants
4. **Final Check**: Performs one final containment check on drag finish (not throttled)
5. **Visual Feedback**: Calls `setHoveredContainerId` to highlight potential parent
6. **Cleanup**: Cancels throttle and RAF on unmount

---

## Files Summary

### Files to Create
1. `app/design-studio/utils/containment-utils.ts` (~150 lines)
2. `app/design-studio/utils/throttle.ts` (~40 lines)

### Files to Update
1. `app/design-studio/hooks/useShapeDragging.ts` - Add containment detection (~200 lines of changes)

---

## Testing Strategy

### Unit Tests

1. **Containment Utils**
   - Test descendant calculation
   - Test container detection with nested groups
   - Test circular relationship prevention

### Integration Tests

1. **Containment Detection**
   - Drag shape into container and verify parent assignment
   - Drag shape out of container and verify parent cleared
   - Test nested container selection (smallest wins)

### Performance Targets

- **Containment Detection**: 30fps (33ms) during drag
- **Position Updates**: 60fps (16ms) during drag
