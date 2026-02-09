# Group/Swimlane System Improvement

**Priority**: Critical
**Gap Severity**: Major
**Estimated New Code**: ~925 lines

---

## Overview

The VS Code extension has a complete group/swimlane system with advanced snapping, while tinkersaur-app only has basic groups with simple containment checks.

### Current State

**Tinkersaur-App:**
```typescript
// Basic Group type exists
interface Group {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  parentGroupId?: string;
  isSelected: boolean;
  isHovered: boolean;
  diagramType?: string;
}

// Simple containment check in useShapeDragging
const isShapeInsideGroup = (shape: Shape, group: Group): boolean => {
  const headerHeight = 40;
  const shapeCenterX = shape.x + shape.width / 2;
  const shapeCenterY = shape.y + shape.height / 2;

  return (
    shapeCenterX >= group.x &&
    shapeCenterX <= group.x + group.width &&
    shapeCenterY >= group.y + headerHeight &&
    shapeCenterY <= group.y + group.height
  );
};
```

**VS Code Extension:**
- Groups are first-class entities with advanced behavior
- Swimlanes are groups with `diagramType: 'bpmn'`
- Full snapping system with adjacency detection
- Child shapes move with parent groups
- Resize handles with constraints

---

## Implementation Guide

### 1.1 Swimlane Snapping System

**Create: `app/design-studio/utils/swimlaneSnapping.ts`**

```typescript
import type { Group } from '~/core/entities/design-studio/types/Group';

/**
 * Configuration for swimlane snapping behavior
 */
export interface SwimlaneSnappingConfig {
  /** Distance threshold (in canvas units) for triggering snap */
  snapThreshold: number;
}

export const DEFAULT_SNAPPING_CONFIG: SwimlaneSnappingConfig = {
  snapThreshold: 10,
};

/**
 * Adjacency information for a swimlane
 */
export interface SwimlaneAdjacency {
  top?: Group;
  bottom?: Group;
  left?: Group;
  right?: Group;
}

/**
 * Computed border visibility for a swimlane
 */
export interface HiddenBorders {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
}

/**
 * Snapping result with adjusted position and dimensions
 */
export interface SnappingResult {
  x: number;
  y: number;
  width: number;
  height: number;
  snappedToTop?: boolean;
  snappedToBottom?: boolean;
  snappedToLeft?: boolean;
  snappedToRight?: boolean;
}

/**
 * Check if two swimlanes have horizontal overlap (for vertical stacking)
 */
function checkHorizontalOverlap(a: Group, b: Group): boolean {
  const aLeft = a.x;
  const aRight = a.x + a.width;
  const bLeft = b.x;
  const bRight = b.x + b.width;

  return aRight > bLeft && aLeft < bRight;
}

/**
 * Check if two swimlanes have vertical overlap (for horizontal adjacency)
 */
function checkVerticalOverlap(a: Group, b: Group): boolean {
  const aTop = a.y;
  const aBottom = a.y + a.height;
  const bTop = b.y;
  const bBottom = b.y + b.height;

  return aBottom > bTop && aTop < bBottom;
}

/**
 * Find all swimlanes that are adjacent to the given swimlane
 */
export function findAdjacentSwimlanes(
  swimlane: Group,
  allSwimlanes: Group[],
  config: SwimlaneSnappingConfig = DEFAULT_SNAPPING_CONFIG
): SwimlaneAdjacency {
  const adjacency: SwimlaneAdjacency = {};
  const otherSwimlanes = allSwimlanes.filter((s) => s.id !== swimlane.id);

  for (const other of otherSwimlanes) {
    const horizontalOverlap = checkHorizontalOverlap(swimlane, other);
    const verticalOverlap = checkVerticalOverlap(swimlane, other);

    // Check for top adjacency
    const topEdgeDistance = Math.abs(swimlane.y - (other.y + other.height));
    if (topEdgeDistance <= config.snapThreshold && horizontalOverlap) {
      adjacency.top = other;
    }

    // Check for bottom adjacency
    const bottomEdgeDistance = Math.abs(swimlane.y + swimlane.height - other.y);
    if (bottomEdgeDistance <= config.snapThreshold && horizontalOverlap) {
      adjacency.bottom = other;
    }

    // Check for left adjacency
    const leftEdgeDistance = Math.abs(swimlane.x - (other.x + other.width));
    if (leftEdgeDistance <= config.snapThreshold && verticalOverlap) {
      adjacency.left = other;
    }

    // Check for right adjacency
    const rightEdgeDistance = Math.abs(swimlane.x + swimlane.width - other.x);
    if (rightEdgeDistance <= config.snapThreshold && verticalOverlap) {
      adjacency.right = other;
    }
  }

  return adjacency;
}

/**
 * Calculate snapped position and matched dimensions when dragging a swimlane
 *
 * Algorithm:
 * 1. Check each other swimlane for proximity
 * 2. If within threshold and has overlap, snap to that edge
 * 3. When snapping vertically (top/bottom):
 *    - Match width to the larger swimlane
 *    - Align left edges
 * 4. When snapping horizontally (left/right):
 *    - Match height to the larger swimlane
 *    - Align top edges
 */
export function calculateSnapPosition(
  swimlane: Group,
  allSwimlanes: Group[],
  config: SwimlaneSnappingConfig = DEFAULT_SNAPPING_CONFIG
): SnappingResult {
  const result: SnappingResult = {
    x: swimlane.x,
    y: swimlane.y,
    width: swimlane.width,
    height: swimlane.height,
  };

  const otherSwimlanes = allSwimlanes.filter((s) => s.id !== swimlane.id);

  for (const other of otherSwimlanes) {
    const horizontalOverlap = checkHorizontalOverlap(swimlane, other);

    if (horizontalOverlap) {
      // Check if we should snap to top (other swimlane is above)
      const topDistance = Math.abs(swimlane.y - (other.y + other.height));
      if (topDistance <= config.snapThreshold) {
        result.y = other.y + other.height;
        result.snappedToTop = true;

        // Match width to the larger swimlane
        const maxWidth = Math.max(swimlane.width, other.width);
        result.width = maxWidth;

        // Align left edges
        const minX = Math.min(swimlane.x, other.x);
        result.x = minX;
      }

      // Check if we should snap to bottom (other swimlane is below)
      const bottomDistance = Math.abs(swimlane.y + swimlane.height - other.y);
      if (bottomDistance <= config.snapThreshold) {
        result.y = other.y - swimlane.height;
        result.snappedToBottom = true;

        // Match width to the larger swimlane
        const maxWidth = Math.max(swimlane.width, other.width);
        result.width = maxWidth;

        // Align left edges
        const minX = Math.min(swimlane.x, other.x);
        result.x = minX;
      }
    }

    const verticalOverlap = checkVerticalOverlap(swimlane, other);

    if (verticalOverlap) {
      // Check if we should snap to left (other swimlane is to the left)
      const leftDistance = Math.abs(swimlane.x - (other.x + other.width));
      if (leftDistance <= config.snapThreshold) {
        result.x = other.x + other.width;
        result.snappedToLeft = true;

        // Match height to the larger swimlane
        const maxHeight = Math.max(swimlane.height, other.height);
        result.height = maxHeight;

        // Align top edges
        const minY = Math.min(swimlane.y, other.y);
        result.y = minY;
      }

      // Check if we should snap to right (other swimlane is to the right)
      const rightDistance = Math.abs(swimlane.x + swimlane.width - other.x);
      if (rightDistance <= config.snapThreshold) {
        result.x = other.x - swimlane.width;
        result.snappedToRight = true;

        // Match height to the larger swimlane
        const maxHeight = Math.max(swimlane.height, other.height);
        result.height = maxHeight;

        // Align top edges
        const minY = Math.min(swimlane.y, other.y);
        result.y = minY;
      }
    }
  }

  return result;
}

/**
 * Determine which borders should be hidden based on exact adjacency
 *
 * Logic:
 * - Hide BOTTOM border of TOP swimlane (not top border of bottom swimlane)
 * - Hide RIGHT border of LEFT swimlane (not left border of right swimlane)
 *
 * This creates seamless appearance when swimlanes are perfectly aligned.
 */
export function calculateHiddenBorders(
  swimlane: Group,
  allSwimlanes: Group[],
  tolerance: number = 1 // Small tolerance for floating point comparison
): HiddenBorders {
  const hidden: HiddenBorders = {};
  const otherSwimlanes = allSwimlanes.filter((s) => s.id !== swimlane.id);

  for (const other of otherSwimlanes) {
    const horizontalOverlap = checkHorizontalOverlap(swimlane, other);

    if (horizontalOverlap) {
      // Check if other swimlane is directly below
      // We are the top swimlane, so hide OUR bottom border
      const isDirectlyBelow = Math.abs(swimlane.y + swimlane.height - other.y) <= tolerance;
      if (isDirectlyBelow) {
        hidden.bottom = true;
      }
    }

    const verticalOverlap = checkVerticalOverlap(swimlane, other);

    if (verticalOverlap) {
      // Check if other swimlane is directly to the right
      // We are the left swimlane, so hide OUR right border
      const isDirectlyRight = Math.abs(swimlane.x + swimlane.width - other.x) <= tolerance;
      if (isDirectlyRight) {
        hidden.right = true;
      }
    }
  }

  return hidden;
}
```

**Key Algorithm Details:**

1. **Overlap Detection**: Uses bounding box intersection for both horizontal and vertical overlap
2. **Snap Threshold**: 10px tolerance for snapping activation
3. **Dimension Matching**: When snapping, swimlanes match the larger dimension and align edges
4. **Border Hiding**: Uses exact position matching (1px tolerance) to determine which borders to hide

---

### 1.2 Group Dragging Hook

**Create: `app/design-studio/hooks/useGroupDragging.ts`**

```typescript
import { useCallback, useRef } from 'react';
import type { Group } from '~/core/entities/design-studio/types/Group';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import { snapToGrid } from '../utils/canvas';
import {
  calculateSnapPosition,
  DEFAULT_SNAPPING_CONFIG,
  type SwimlaneSnappingConfig,
} from '../utils/swimlaneSnapping';

interface UseGroupDraggingProps {
  groups: Group[];
  shapes: Shape[];
  updateGroup: (id: string, updates: Partial<Group>) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  viewportTransform: {
    screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
  };
  isActive: boolean;
  draggingGroupId: string | null;
  gridSnappingEnabled: boolean;
  swimlaneSnappingConfig?: SwimlaneSnappingConfig;
}

interface UseGroupDraggingReturn {
  startDraggingGroup: (groupId: string) => void;
  updateGroupDragging: (screenX: number, screenY: number) => void;
  finishGroupDragging: () => void;
}

interface GroupDragData {
  groupId: string;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  childShapeIds: string[];
  childInitialPositions: Map<string, { x: number; y: number }>;
  startCanvasX: number;
  startCanvasY: number;
}

/**
 * Hook for managing group dragging functionality
 *
 * Key Behaviors:
 * - Drags group and all child shapes together
 * - Applies swimlane snapping for BPMN diagrams
 * - Falls back to grid snapping for non-BPMN groups
 * - Maintains child shape positions relative to group
 */
export function useGroupDragging({
  groups,
  shapes,
  updateGroup,
  updateShape,
  viewportTransform,
  isActive,
  draggingGroupId,
  gridSnappingEnabled,
  swimlaneSnappingConfig = DEFAULT_SNAPPING_CONFIG,
}: UseGroupDraggingProps): UseGroupDraggingReturn {
  const dragDataRef = useRef<GroupDragData | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  /**
   * Initialize group dragging
   * Captures initial positions of group and all child shapes
   */
  const startDraggingGroup = useCallback(
    (groupId: string) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      // Find all shapes that belong to this group
      const childShapes = shapes.filter((s) => s.parentGroupId === groupId);
      const childShapeIds = childShapes.map((s) => s.id);
      const childInitialPositions = new Map<string, { x: number; y: number }>();

      childShapes.forEach((shape) => {
        childInitialPositions.set(shape.id, { x: shape.x, y: shape.y });
      });

      dragDataRef.current = {
        groupId,
        initialX: group.x,
        initialY: group.y,
        initialWidth: group.width,
        initialHeight: group.height,
        childShapeIds,
        childInitialPositions,
        startCanvasX: 0,
        startCanvasY: 0,
      };
      dragStartPosRef.current = null;
    },
    [groups, shapes]
  );

  /**
   * Update group dragging position
   *
   * Algorithm:
   * 1. Convert screen coordinates to canvas coordinates
   * 2. Calculate total delta from drag start
   * 3. Apply delta to group position
   * 4. Check if group is BPMN swimlane
   * 5. If swimlane, apply swimlane snapping (may adjust width/height)
   * 6. Otherwise, apply grid snapping if enabled
   * 7. Calculate actual applied delta (may differ due to snapping)
   * 8. Apply same delta to all child shapes
   */
  const updateGroupDragging = useCallback(
    (screenX: number, screenY: number) => {
      if (!isActive || !draggingGroupId || !dragDataRef.current) return;

      const { x: currentCanvasX, y: currentCanvasY } = viewportTransform.screenToCanvas(
        screenX,
        screenY
      );

      // Initialize drag start position on first update
      if (dragStartPosRef.current === null) {
        dragStartPosRef.current = { x: currentCanvasX, y: currentCanvasY };
        return;
      }

      // Calculate total delta from drag start
      const totalDeltaX = currentCanvasX - dragStartPosRef.current.x;
      const totalDeltaY = currentCanvasY - dragStartPosRef.current.y;

      // Calculate new position from initial + delta
      let newX = dragDataRef.current.initialX + totalDeltaX;
      let newY = dragDataRef.current.initialY + totalDeltaY;
      let newWidth = dragDataRef.current.initialWidth;
      let newHeight = dragDataRef.current.initialHeight;

      // Check if this is a BPMN swimlane
      const draggingGroup = groups.find((g) => g.id === draggingGroupId);
      const isBpmnSwimlane = draggingGroup?.diagramType === 'bpmn';

      if (isBpmnSwimlane && draggingGroup) {
        // Create temporary group with current drag position
        const tempGroup: Group = {
          ...draggingGroup,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };

        // Apply swimlane snapping (may adjust position AND dimensions)
        const snapResult = calculateSnapPosition(tempGroup, groups, swimlaneSnappingConfig);
        newX = snapResult.x;
        newY = snapResult.y;
        newWidth = snapResult.width;
        newHeight = snapResult.height;
      } else if (gridSnappingEnabled) {
        // Apply grid snapping for non-BPMN groups
        newX = snapToGrid(newX);
        newY = snapToGrid(newY);
      }

      // Calculate the actual delta applied (may differ from totalDelta due to snapping)
      const appliedDeltaX = newX - dragDataRef.current.initialX;
      const appliedDeltaY = newY - dragDataRef.current.initialY;

      // Update the group position and dimensions
      updateGroup(draggingGroupId, { x: newX, y: newY, width: newWidth, height: newHeight });

      // Update all child shapes with the same delta
      const dragData = dragDataRef.current;
      dragData.childShapeIds.forEach((shapeId) => {
        const initialPos = dragData.childInitialPositions.get(shapeId);
        if (initialPos) {
          let newShapeX = initialPos.x + appliedDeltaX;
          let newShapeY = initialPos.y + appliedDeltaY;

          if (gridSnappingEnabled && !isBpmnSwimlane) {
            newShapeX = snapToGrid(newShapeX);
            newShapeY = snapToGrid(newShapeY);
          }

          updateShape(shapeId, { x: newShapeX, y: newShapeY });
        }
      });
    },
    [
      isActive,
      draggingGroupId,
      updateGroup,
      updateShape,
      viewportTransform,
      gridSnappingEnabled,
      groups,
      swimlaneSnappingConfig,
    ]
  );

  const finishGroupDragging = useCallback(() => {
    dragDataRef.current = null;
    dragStartPosRef.current = null;
  }, []);

  return {
    startDraggingGroup,
    updateGroupDragging,
    finishGroupDragging,
  };
}
```

**Key Implementation Details:**

1. **Child Shape Synchronization**: All child shapes move by the same delta as the group
2. **Swimlane Detection**: Checks `diagramType === 'bpmn'` to enable swimlane-specific behavior
3. **Dual Snapping**: Swimlane snapping for BPMN, grid snapping for others
4. **Dimension Adjustment**: Swimlane snapping can change width/height, not just position
5. **Applied Delta Calculation**: Tracks actual delta after snapping to sync children correctly

---

### 1.3 Group Resizing Hook

**Create: `app/design-studio/hooks/useGroupResizing.ts`**

```typescript
import { useCallback, useRef } from 'react';
import type { Group } from '~/core/entities/design-studio/types/Group';
import { snapToGrid } from '../utils/canvas';

interface UseGroupResizingProps {
  groups: Group[];
  updateGroup: (id: string, updates: Partial<Group>) => void;
  viewportTransform: {
    screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
  };
  isActive: boolean;
  resizingGroupId: string | null;
  resizingHandle: string | null; // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  gridSnappingEnabled: boolean;
}

interface UseGroupResizingReturn {
  startResizingGroup: (groupId: string, handle: string) => void;
  updateGroupResizing: (screenX: number, screenY: number) => void;
  finishGroupResizing: () => void;
}

interface GroupResizeData {
  groupId: string;
  handle: string;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  startCanvasX: number;
  startCanvasY: number;
}

const MIN_GROUP_WIDTH = 100;
const MIN_GROUP_HEIGHT = 60;

/**
 * Hook for managing group resizing functionality
 *
 * Supports 8 resize handles: 4 corners + 4 edges
 * Applies minimum size constraints
 * Supports grid snapping
 */
export function useGroupResizing({
  groups,
  updateGroup,
  viewportTransform,
  isActive,
  resizingGroupId,
  resizingHandle,
  gridSnappingEnabled,
}: UseGroupResizingProps): UseGroupResizingReturn {
  const resizeDataRef = useRef<GroupResizeData | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const startResizingGroup = useCallback(
    (groupId: string, handle: string) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      resizeDataRef.current = {
        groupId,
        handle,
        initialX: group.x,
        initialY: group.y,
        initialWidth: group.width,
        initialHeight: group.height,
        startCanvasX: 0,
        startCanvasY: 0,
      };
      dragStartPosRef.current = null;
    },
    [groups]
  );

  /**
   * Update group resizing
   *
   * Algorithm based on resize handle:
   * - East (e): Adjust width
   * - West (w): Adjust x and width
   * - South (s): Adjust height
   * - North (n): Adjust y and height
   * - Corners: Combination of two edges
   */
  const updateGroupResizing = useCallback(
    (screenX: number, screenY: number) => {
      if (!isActive || !resizingGroupId || !resizingHandle || !resizeDataRef.current) return;

      const { x: currentCanvasX, y: currentCanvasY } = viewportTransform.screenToCanvas(
        screenX,
        screenY
      );

      // Initialize drag start position
      if (dragStartPosRef.current === null) {
        dragStartPosRef.current = { x: currentCanvasX, y: currentCanvasY };
        return;
      }

      const deltaX = currentCanvasX - dragStartPosRef.current.x;
      const deltaY = currentCanvasY - dragStartPosRef.current.y;

      const data = resizeDataRef.current;
      let newX = data.initialX;
      let newY = data.initialY;
      let newWidth = data.initialWidth;
      let newHeight = data.initialHeight;

      // Apply resize based on handle
      const handle = data.handle;

      if (handle.includes('e')) {
        // East: adjust width
        newWidth = Math.max(MIN_GROUP_WIDTH, data.initialWidth + deltaX);
      }

      if (handle.includes('w')) {
        // West: adjust x and width
        const proposedWidth = data.initialWidth - deltaX;
        if (proposedWidth >= MIN_GROUP_WIDTH) {
          newX = data.initialX + deltaX;
          newWidth = proposedWidth;
        } else {
          newX = data.initialX + data.initialWidth - MIN_GROUP_WIDTH;
          newWidth = MIN_GROUP_WIDTH;
        }
      }

      if (handle.includes('s')) {
        // South: adjust height
        newHeight = Math.max(MIN_GROUP_HEIGHT, data.initialHeight + deltaY);
      }

      if (handle.includes('n')) {
        // North: adjust y and height
        const proposedHeight = data.initialHeight - deltaY;
        if (proposedHeight >= MIN_GROUP_HEIGHT) {
          newY = data.initialY + deltaY;
          newHeight = proposedHeight;
        } else {
          newY = data.initialY + data.initialHeight - MIN_GROUP_HEIGHT;
          newHeight = MIN_GROUP_HEIGHT;
        }
      }

      // Apply grid snapping
      if (gridSnappingEnabled) {
        newX = snapToGrid(newX);
        newY = snapToGrid(newY);
        newWidth = snapToGrid(newWidth);
        newHeight = snapToGrid(newHeight);
      }

      updateGroup(resizingGroupId, { x: newX, y: newY, width: newWidth, height: newHeight });
    },
    [isActive, resizingGroupId, resizingHandle, updateGroup, viewportTransform, gridSnappingEnabled]
  );

  const finishGroupResizing = useCallback(() => {
    resizeDataRef.current = null;
    dragStartPosRef.current = null;
  }, []);

  return {
    startResizingGroup,
    updateGroupResizing,
    finishGroupResizing,
  };
}
```

**Key Implementation Details:**

1. **8 Resize Handles**: Supports corners (nw, ne, sw, se) and edges (n, s, e, w)
2. **Minimum Size Constraints**: 100px width, 60px height to prevent groups from becoming too small
3. **Edge Cases**: When dragging west/north, prevents width/height from going below minimum
4. **Grid Snapping**: Applied to all dimensions (x, y, width, height)

---

### 1.4 BPMN Swimlane Component

**Create: `app/design-studio/diagrams/bpmn/components/BpmnSwimlane.tsx`**

```typescript
import React, { useMemo } from 'react';
import type { Group } from '~/core/entities/design-studio/types/Group';
import { calculateHiddenBorders } from '../../../utils/swimlaneSnapping';

interface BpmnSwimlaneProps {
  group: Group;
  allGroups: Group[];
  isSelected: boolean;
  isHovered: boolean;
  onMouseDown: (e: React.MouseEvent, groupId: string) => void;
  onMouseEnter: (e: React.MouseEvent, groupId: string) => void;
  onMouseLeave: (e: React.MouseEvent, groupId: string) => void;
  onDoubleClick: (groupId: string) => void;
  onLabelChange: (groupId: string, newLabel: string) => void;
  onFinishEdit: () => void;
  isEditing: boolean;
  onResizeHandleMouseDown?: (handle: string, e: React.MouseEvent, groupId: string) => void;
}

const HEADER_HEIGHT = 40;
const RESIZE_HANDLE_SIZE = 8;

/**
 * BPMN Swimlane Component
 *
 * Features:
 * - Smart border hiding when adjacent to other swimlanes
 * - Horizontal orientation (label on left side)
 * - Header area (40px) with label
 * - Body area for shapes
 * - Resize handles when selected
 */
export function BpmnSwimlane({
  group,
  allGroups,
  isSelected,
  isHovered,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onLabelChange,
  onFinishEdit,
  isEditing,
  onResizeHandleMouseDown,
}: BpmnSwimlaneProps) {
  // Calculate which borders should be hidden
  const hiddenBorders = useMemo(
    () => calculateHiddenBorders(group, allGroups),
    [group, allGroups]
  );

  return (
    <g>
      {/* Main swimlane rectangle */}
      <rect
        x={group.x}
        y={group.y}
        width={group.width}
        height={group.height}
        fill="white"
        stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#d1d5db'}
        strokeWidth={isSelected ? 2 : 1}
        onMouseDown={(e) => onMouseDown(e, group.id)}
        onMouseEnter={(e) => onMouseEnter(e, group.id)}
        onMouseLeave={(e) => onMouseLeave(e, group.id)}
        onDoubleClick={() => onDoubleClick(group.id)}
        style={{ cursor: 'move' }}
      />

      {/* Header area (vertical stripe on left) */}
      <rect
        x={group.x}
        y={group.y}
        width={HEADER_HEIGHT}
        height={group.height}
        fill="#f3f4f6"
        stroke="none"
        pointerEvents="none"
      />

      {/* Vertical line separating header from body */}
      {!hiddenBorders.right && (
        <line
          x1={group.x + HEADER_HEIGHT}
          y1={group.y}
          x2={group.x + HEADER_HEIGHT}
          y2={group.y + group.height}
          stroke="#d1d5db"
          strokeWidth={1}
          pointerEvents="none"
        />
      )}

      {/* Hide bottom border if adjacent */}
      {hiddenBorders.bottom && (
        <line
          x1={group.x}
          y1={group.y + group.height}
          x2={group.x + group.width}
          y2={group.y + group.height}
          stroke="white"
          strokeWidth={2}
          pointerEvents="none"
        />
      )}

      {/* Hide right border if adjacent */}
      {hiddenBorders.right && (
        <line
          x1={group.x + group.width}
          y1={group.y}
          x2={group.x + group.width}
          y2={group.y + group.height}
          stroke="white"
          strokeWidth={2}
          pointerEvents="none"
        />
      )}

      {/* Label (rotated 90 degrees, centered in header) */}
      {!isEditing && (
        <text
          x={group.x + HEADER_HEIGHT / 2}
          y={group.y + group.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          fontWeight={500}
          fill="#374151"
          transform={`rotate(-90, ${group.x + HEADER_HEIGHT / 2}, ${group.y + group.height / 2})`}
          pointerEvents="none"
        >
          {group.label}
        </text>
      )}

      {/* Editable label input (when double-clicked) */}
      {isEditing && (
        <foreignObject
          x={group.x + HEADER_HEIGHT / 2 - 50}
          y={group.y + group.height / 2 - 10}
          width={100}
          height={20}
        >
          <input
            type="text"
            value={group.label}
            onChange={(e) => onLabelChange(group.id, e.target.value)}
            onBlur={onFinishEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onFinishEdit();
            }}
            autoFocus
            style={{
              width: '100%',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid #3b82f6',
              borderRadius: '2px',
              padding: '2px',
            }}
          />
        </foreignObject>
      )}

      {/* Resize handles (when selected) */}
      {isSelected && onResizeHandleMouseDown && (
        <>
          {/* Corner handles */}
          <rect
            x={group.x - RESIZE_HANDLE_SIZE / 2}
            y={group.y - RESIZE_HANDLE_SIZE / 2}
            width={RESIZE_HANDLE_SIZE}
            height={RESIZE_HANDLE_SIZE}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={1}
            style={{ cursor: 'nw-resize' }}
            onMouseDown={(e) => onResizeHandleMouseDown('nw', e, group.id)}
          />
          <rect
            x={group.x + group.width - RESIZE_HANDLE_SIZE / 2}
            y={group.y - RESIZE_HANDLE_SIZE / 2}
            width={RESIZE_HANDLE_SIZE}
            height={RESIZE_HANDLE_SIZE}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={1}
            style={{ cursor: 'ne-resize' }}
            onMouseDown={(e) => onResizeHandleMouseDown('ne', e, group.id)}
          />
          <rect
            x={group.x - RESIZE_HANDLE_SIZE / 2}
            y={group.y + group.height - RESIZE_HANDLE_SIZE / 2}
            width={RESIZE_HANDLE_SIZE}
            height={RESIZE_HANDLE_SIZE}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={1}
            style={{ cursor: 'sw-resize' }}
            onMouseDown={(e) => onResizeHandleMouseDown('sw', e, group.id)}
          />
          <rect
            x={group.x + group.width - RESIZE_HANDLE_SIZE / 2}
            y={group.y + group.height - RESIZE_HANDLE_SIZE / 2}
            width={RESIZE_HANDLE_SIZE}
            height={RESIZE_HANDLE_SIZE}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={1}
            style={{ cursor: 'se-resize' }}
            onMouseDown={(e) => onResizeHandleMouseDown('se', e, group.id)}
          />

          {/* Edge handles */}
          <rect
            x={group.x + group.width / 2 - RESIZE_HANDLE_SIZE / 2}
            y={group.y - RESIZE_HANDLE_SIZE / 2}
            width={RESIZE_HANDLE_SIZE}
            height={RESIZE_HANDLE_SIZE}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={1}
            style={{ cursor: 'n-resize' }}
            onMouseDown={(e) => onResizeHandleMouseDown('n', e, group.id)}
          />
          <rect
            x={group.x + group.width / 2 - RESIZE_HANDLE_SIZE / 2}
            y={group.y + group.height - RESIZE_HANDLE_SIZE / 2}
            width={RESIZE_HANDLE_SIZE}
            height={RESIZE_HANDLE_SIZE}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={1}
            style={{ cursor: 's-resize' }}
            onMouseDown={(e) => onResizeHandleMouseDown('s', e, group.id)}
          />
          <rect
            x={group.x - RESIZE_HANDLE_SIZE / 2}
            y={group.y + group.height / 2 - RESIZE_HANDLE_SIZE / 2}
            width={RESIZE_HANDLE_SIZE}
            height={RESIZE_HANDLE_SIZE}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={1}
            style={{ cursor: 'w-resize' }}
            onMouseDown={(e) => onResizeHandleMouseDown('w', e, group.id)}
          />
          <rect
            x={group.x + group.width - RESIZE_HANDLE_SIZE / 2}
            y={group.y + group.height / 2 - RESIZE_HANDLE_SIZE / 2}
            width={RESIZE_HANDLE_SIZE}
            height={RESIZE_HANDLE_SIZE}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={1}
            style={{ cursor: 'e-resize' }}
            onMouseDown={(e) => onResizeHandleMouseDown('e', e, group.id)}
          />
        </>
      )}
    </g>
  );
}
```

**Key Implementation Details:**

1. **Border Hiding**: Uses white strokes to cover borders where swimlanes are adjacent
2. **Header Layout**: 40px vertical stripe on left with rotated label
3. **Resize Handles**: 8 handles (4 corners + 4 edges), 8px size
4. **Double-Click Editing**: Shows text input for label editing
5. **Visual Feedback**: Different stroke colors for selected/hovered states

---

### 1.5 Integration into Event Orchestrator

**Update: `app/design-studio/hooks/useCanvasEventOrchestrator.ts`**

```typescript
// Add to imports
import { useGroupDragging } from './useGroupDragging';
import { useGroupResizing } from './useGroupResizing';
import { useGroupInteraction } from './useGroupInteraction';

// Add to state machine modes
type InteractionMode =
  | 'idle'
  | 'panning'
  | 'selecting'
  | 'dragging-shapes'
  | 'dragging-group'      // NEW
  | 'resizing-group'      // NEW
  | 'drawing-connector'
  | 'resizing-shapes';

// Add to useInteractionState hook
const {
  mode,
  // ... existing
  draggingGroupId,        // NEW
  resizingGroupId,        // NEW
  resizingHandle,         // NEW
  setDraggingGroup,       // NEW
  setResizingGroup,       // NEW
} = useInteractionState();

// Add group dragging hook
const {
  startDraggingGroup,
  updateGroupDragging,
  finishGroupDragging,
} = useGroupDragging({
  groups,
  shapes,
  updateGroup,
  updateShape,
  viewportTransform,
  isActive: mode === 'dragging-group',
  draggingGroupId,
  gridSnappingEnabled,
  swimlaneSnappingConfig: { snapThreshold: 10 },
});

// Add group resizing hook
const {
  startResizingGroup,
  updateGroupResizing,
  finishGroupResizing,
} = useGroupResizing({
  groups,
  updateGroup,
  viewportTransform,
  isActive: mode === 'resizing-group',
  resizingGroupId,
  resizingHandle,
  gridSnappingEnabled,
});

// Add group interaction hook
const {
  handleGroupMouseDown,
  handleGroupMouseEnter,
  handleGroupMouseLeave,
} = useGroupInteraction({
  selectedGroupIds,
  setSelectedGroups,
  clearShapeSelection,
  clearConnectorSelection,
  setHoveredGroupId,
  startDraggingGroup: (groupId: string) => {
    startDraggingGroup(groupId);
    setDraggingGroup(groupId);
  },
  groups,
});

// Add to mouse orchestration
const { handleMouseMove } = useCanvasMouseOrchestration({
  // ... existing props
  updateGroupDragging,
  finishGroupDragging,
  updateGroupResizing,
  finishGroupResizing,
  // ... existing props
});

// Return group handlers
return {
  // ... existing handlers
  handleGroupMouseDown,
  handleGroupMouseEnter,
  handleGroupMouseLeave,
  handleGroupDoubleClick,
  handleGroupResizeHandleMouseDown: (handle: string, e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    startResizingGroup(groupId, handle);
    setResizingGroup(groupId, handle);
  },
};
```

---

## Files Summary

### Files to Create
1. `app/design-studio/utils/swimlaneSnapping.ts` (~280 lines)
2. `app/design-studio/hooks/useGroupDragging.ts` (~195 lines)
3. `app/design-studio/hooks/useGroupResizing.ts` (~150 lines)
4. `app/design-studio/diagrams/bpmn/components/BpmnSwimlane.tsx` (~200 lines)
5. `app/design-studio/hooks/useGroupInteraction.ts` (~100 lines)

### Files to Update
1. `app/design-studio/hooks/useCanvasEventOrchestrator.ts` - Add group modes and handlers
2. `app/design-studio/hooks/useInteractionState.ts` - Add dragging-group and resizing-group modes

---

## Testing Strategy

### Unit Tests

1. **Swimlane Snapping**
   - Test adjacency detection with various positions
   - Test snap threshold behavior
   - Test dimension matching
   - Test border hiding logic

### Integration Tests

1. **Group Dragging**
   - Drag group and verify children move together
   - Test swimlane snapping behavior
   - Test grid snapping fallback

### Performance Targets

- **Swimlane Snapping**: <5ms per snap calculation
