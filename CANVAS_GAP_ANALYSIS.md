# Canvas & Diagramming Gap Analysis
## VS Code Extension vs Tinkersaur-App

**Date**: February 3, 2026
**Status**: VS Code Extension has significantly exceeded tinkersaur-app capabilities

---

## Executive Summary

The VS Code extension canvas implementation has evolved beyond its tinkersaur-app origins and now offers superior functionality in key areas. Despite having **43% fewer lines of code** (20,700 vs 36,753), the VS Code extension delivers:

- ✅ Complete group/swimlane system with advanced snapping
- ✅ Full sequence diagram support with automatic activation calculation
- ✅ Intelligent parent-child containment system
- ✅ Bidirectional Mermaid synchronization
- ✅ Extensible diagram features architecture
- ✅ Advanced lifeline controls and auto-layout

---

## Feature Comparison Matrix

| Feature Category | VS Code Extension | Tinkersaur-App | Gap Severity |
|-----------------|-------------------|----------------|--------------|
| **Group/Swimlane System** | ✅ Full implementation | ⚠️ Basic groups only | 🔴 Critical |
| **Sequence Diagrams** | ✅ Complete | ❌ Incomplete stub | 🔴 Critical |
| **Containment Logic** | ✅ Auto-detection | ❌ Manual only | 🔴 Critical |
| **Diagram Features System** | ✅ Extensible architecture | ❌ Not present | 🟡 Major |
| **Content Sync** | ✅ Bidirectional auto-sync | ⚠️ Manual import/export | 🟡 Major |
| **Connector Routing** | ✅ Orthogonal + Visibility | ✅ Orthogonal + Visibility | ✅ Parity |
| **BPMN Support** | ✅ Full + Swimlanes | ✅ Full, no swimlanes | 🟡 Major |
| **Architecture Diagrams** | ✅ Full | ✅ Full | ✅ Parity |
| **Class Diagrams** | ✅ Full | ✅ Full | ✅ Parity |
| **ER Diagrams** | ✅ Full | ✅ Full | ✅ Parity |

---

## 1. Group/Swimlane System 🔴

### Current State Analysis

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
```typescript
// Groups are first-class entities with advanced behavior
// Swimlanes are groups with diagramType: 'bpmn'
// Full snapping system with adjacency detection
// Child shapes move with parent groups
// Resize handles with constraints
```

### Implementation Guide

#### 1.1 Swimlane Snapping System

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

#### 1.2 Group Dragging Hook

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

#### 1.3 Group Resizing Hook

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

#### 1.4 BPMN Swimlane Component

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

  // Build stroke style based on hidden borders
  const strokeDasharray = useMemo(() => {
    if (!hiddenBorders.bottom && !hiddenBorders.right) {
      return undefined; // All borders visible
    }

    // Calculate dash pattern for selective border hiding
    // This is complex - for simplicity, use separate rect elements
    return undefined;
  }, [hiddenBorders]);

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

#### 1.5 Integration into Event Orchestrator

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

## 2. Sequence Diagram Support 🔴

### Current State Analysis

**Tinkersaur-App:**
- Folder structure exists but implementation incomplete
- Has some components (`SequenceLifelineRenderer`, `SequenceNoteRenderer`)
- Has activation calculator stub
- Not integrated into main canvas
- No auto-calculation of activation boxes
- No lifeline controls

**VS Code Extension:**
- Complete sequence diagram support
- Automatic activation box calculation when messages change
- Lifeline extend/shrink controls with validation
- Specialized message connector rendering
- Full Mermaid import/export

### Implementation Guide

#### 2.1 Activation Box Calculation

**Create: `app/design-studio/diagrams/sequence/activationCalculator.ts`**

```typescript
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';

/**
 * Represents a period of activation on a lifeline
 */
export interface Activation {
  /** Y position where activation starts */
  startY: number;
  /** Y position where activation ends */
  endY: number;
  /** Nesting level (for recursive calls) */
  level: number;
}

/**
 * Calculate activation boxes for all lifelines based on message connectors
 *
 * Algorithm:
 * 1. Filter for sequence lifelines and message connectors
 * 2. For each lifeline, find all messages involving it
 * 3. Group messages by activation periods (overlapping Y ranges)
 * 4. Calculate nesting levels for overlapping activations
 * 5. Return map of lifeline ID -> activations array
 */
export function calculateAllLifelineActivations(
  shapes: Shape[],
  connectors: Connector[]
): Map<string, Activation[]> {
  const activationsMap = new Map<string, Activation[]>();

  // Get all sequence lifelines
  const lifelines = shapes.filter((s) => s.type === 'sequence-lifeline');

  // Get all message connectors
  const messages = connectors.filter((c) =>
    c.type?.startsWith('sequence-message-')
  );

  for (const lifeline of lifelines) {
    const activations = calculateLifelineActivations(lifeline, messages, shapes);
    activationsMap.set(lifeline.id, activations);
  }

  return activationsMap;
}

/**
 * Calculate activations for a single lifeline
 */
function calculateLifelineActivations(
  lifeline: Shape,
  messages: Connector[],
  allShapes: Shape[]
): Activation[] {
  // Find all messages where this lifeline is the target (receives a message)
  const incomingMessages = messages.filter((m) => m.targetId === lifeline.id);

  // Find all messages where this lifeline is the source (sends a message)
  const outgoingMessages = messages.filter((m) => m.sourceId === lifeline.id);

  // Build activation periods
  const activationPeriods: { startY: number; endY: number }[] = [];

  for (const incoming of incomingMessages) {
    const startY = getMessageY(incoming, allShapes);

    // Find the corresponding return message or next incoming message
    let endY = startY + 40; // Default activation height

    // Look for return message from this lifeline to the sender
    const returnMessage = messages.find(
      (m) =>
        m.sourceId === lifeline.id &&
        m.targetId === incoming.sourceId &&
        m.type === 'sequence-message-return' &&
        getMessageY(m, allShapes) > startY
    );

    if (returnMessage) {
      endY = getMessageY(returnMessage, allShapes);
    } else {
      // Look for next outgoing message
      const nextOutgoing = outgoingMessages
        .filter((m) => getMessageY(m, allShapes) > startY)
        .sort((a, b) => getMessageY(a, allShapes) - getMessageY(b, allShapes))[0];

      if (nextOutgoing) {
        endY = getMessageY(nextOutgoing, allShapes);
      }
    }

    activationPeriods.push({ startY, endY });
  }

  // Merge overlapping periods and calculate nesting levels
  const mergedActivations = mergeAndNestActivations(activationPeriods);

  return mergedActivations;
}

/**
 * Get the Y position of a message (average of source and target Y positions)
 */
function getMessageY(connector: Connector, shapes: Shape[]): number {
  const sourceShape = shapes.find((s) => s.id === connector.sourceId);
  const targetShape = shapes.find((s) => s.id === connector.targetId);

  if (!sourceShape || !targetShape) return 0;

  // For horizontal messages, use the Y position
  // Messages are typically drawn at the same Y level
  return Math.min(sourceShape.y, targetShape.y) + 20; // Offset from top of lifeline header
}

/**
 * Merge overlapping activation periods and calculate nesting levels
 */
function mergeAndNestActivations(
  periods: { startY: number; endY: number }[]
): Activation[] {
  if (periods.length === 0) return [];

  // Sort by start position
  const sorted = [...periods].sort((a, b) => a.startY - b.startY);

  const result: Activation[] = [];
  let currentLevel = 0;

  for (const period of sorted) {
    // Check if this period overlaps with any existing activation
    let level = 0;
    for (const existing of result) {
      if (
        period.startY < existing.endY &&
        period.endY > existing.startY
      ) {
        level = Math.max(level, existing.level + 1);
      }
    }

    result.push({
      startY: period.startY,
      endY: period.endY,
      level,
    });
  }

  return result;
}
```

**Key Algorithm Details:**

1. **Message Detection**: Finds incoming messages (where lifeline is target)
2. **Return Message Matching**: Looks for return messages to determine activation end
3. **Default Height**: Uses 40px default if no return message found
4. **Nesting Calculation**: Overlapping activations get incremented level for visual offset
5. **Y Position**: Calculated from message connector positions

#### 2.2 Lifeline Height Validation

**Create: `app/design-studio/diagrams/sequence/heightCalculator.ts`**

```typescript
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';

export const LIFELINE_EXTENSION_INCREMENT = 100;
export const DEFAULT_LIFELINE_HEIGHT = 300;
const HEADER_HEIGHT = 50;
const BOTTOM_PADDING = 20;

/**
 * Check if lifelines can be shrunk without cutting off messages
 *
 * Returns:
 * - canShrink: boolean indicating if shrinking is safe
 * - reason: explanation if shrinking is blocked
 */
export function canShrinkLifelines(
  shapes: Shape[],
  connectors: Connector[]
): { canShrink: boolean; reason?: string } {
  const lifelines = shapes.filter((s) => s.type === 'sequence-lifeline');

  if (lifelines.length === 0) {
    return { canShrink: false, reason: 'No lifelines present' };
  }

  // Find the lowest message position across all lifelines
  let maxMessageY = 0;

  for (const lifeline of lifelines) {
    const messages = connectors.filter(
      (c) => c.sourceId === lifeline.id || c.targetId === lifeline.id
    );

    for (const message of messages) {
      // Get the Y position of this message relative to the lifeline
      const messageY = getMessageYRelativeToLifeline(message, lifeline, shapes);
      maxMessageY = Math.max(maxMessageY, messageY);
    }
  }

  // Calculate minimum required height
  const minRequiredHeight = maxMessageY + BOTTOM_PADDING;

  // Calculate what the new height would be after shrinking
  const currentMinHeight = Math.min(...lifelines.map((l) => l.height));
  const newHeight = Math.max(
    DEFAULT_LIFELINE_HEIGHT,
    currentMinHeight - LIFELINE_EXTENSION_INCREMENT
  );

  if (newHeight < minRequiredHeight) {
    return {
      canShrink: false,
      reason: `Cannot shrink: Messages extend to Y=${maxMessageY.toFixed(0)}. Minimum height is ${minRequiredHeight.toFixed(0)}px.`,
    };
  }

  return { canShrink: true };
}

/**
 * Get message Y position relative to lifeline top
 */
function getMessageYRelativeToLifeline(
  connector: Connector,
  lifeline: Shape,
  allShapes: Shape[]
): number {
  const sourceShape = allShapes.find((s) => s.id === connector.sourceId);
  const targetShape = allShapes.find((s) => s.id === connector.targetId);

  if (!sourceShape || !targetShape) return 0;

  // Calculate message Y position
  const messageY = Math.min(sourceShape.y, targetShape.y) + HEADER_HEIGHT;

  // Calculate relative to lifeline top
  return messageY - lifeline.y;
}
```

**Key Implementation Details:**

1. **Message Scanning**: Checks all messages connected to any lifeline
2. **Minimum Height Calculation**: Finds lowest message position + padding
3. **Validation**: Compares proposed new height against minimum required
4. **User Feedback**: Returns reason string for tooltip/notification

#### 2.3 Sequence Lifeline Component

**Create: `app/design-studio/diagrams/sequence/components/SequenceLifeline.tsx`**

```typescript
import React from 'react';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Activation } from '../activationCalculator';

interface SequenceLifelineProps {
  shape: Shape;
  isSelected: boolean;
  isHovered: boolean;
  isEditing: boolean;
  onMouseDown: (e: React.MouseEvent, shapeId: string) => void;
  onMouseEnter: (e: React.MouseEvent, shapeId: string) => void;
  onMouseLeave: (e: React.MouseEvent, shapeId: string) => void;
  onDoubleClick: (shapeId: string) => void;
  onLabelChange: (shapeId: string, newLabel: string) => void;
  onFinishEdit: () => void;
  onConnectionPointMouseDown?: (connectionPointId: string, e: React.MouseEvent) => void;
  onConnectionPointMouseUp?: (connectionPointId: string, e: React.MouseEvent) => void;
}

const HEADER_HEIGHT = 50;
const HEADER_WIDTH = 120;
const ACTIVATION_WIDTH = 10;
const ACTIVATION_OFFSET = 5; // Offset for nested activations

/**
 * Sequence Lifeline Component
 *
 * Structure:
 * - Header box (rectangle with participant name)
 * - Dashed vertical line (lifespan)
 * - Activation boxes (solid rectangles on the line)
 * - Connection points for messages
 */
export function SequenceLifeline({
  shape,
  isSelected,
  isHovered,
  isEditing,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onLabelChange,
  onFinishEdit,
  onConnectionPointMouseDown,
  onConnectionPointMouseUp,
}: SequenceLifelineProps) {
  // Extract activations from shape data
  const activations: Activation[] = (shape.data as { activations?: Activation[] })?.activations || [];

  // Calculate lifeline center X for the dashed line
  const lineX = shape.x + HEADER_WIDTH / 2;

  return (
    <g>
      {/* Header box */}
      <rect
        x={shape.x}
        y={shape.y}
        width={HEADER_WIDTH}
        height={HEADER_HEIGHT}
        fill="white"
        stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#000'}
        strokeWidth={isSelected ? 2 : 1}
        rx={5}
        ry={5}
        onMouseDown={(e) => onMouseDown(e, shape.id)}
        onMouseEnter={(e) => onMouseEnter(e, shape.id)}
        onMouseLeave={(e) => onMouseLeave(e, shape.id)}
        onDoubleClick={() => onDoubleClick(shape.id)}
        style={{ cursor: 'move' }}
      />

      {/* Label */}
      {!isEditing && (
        <text
          x={shape.x + HEADER_WIDTH / 2}
          y={shape.y + HEADER_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          fontWeight={500}
          fill="#000"
          pointerEvents="none"
        >
          {shape.label}
        </text>
      )}

      {/* Editable label */}
      {isEditing && (
        <foreignObject
          x={shape.x + 5}
          y={shape.y + HEADER_HEIGHT / 2 - 10}
          width={HEADER_WIDTH - 10}
          height={20}
        >
          <input
            type="text"
            value={shape.label}
            onChange={(e) => onLabelChange(shape.id, e.target.value)}
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

      {/* Dashed vertical lifeline */}
      <line
        x1={lineX}
        y1={shape.y + HEADER_HEIGHT}
        x2={lineX}
        y2={shape.y + shape.height}
        stroke="#000"
        strokeWidth={1}
        strokeDasharray="5,5"
        pointerEvents="none"
      />

      {/* Activation boxes */}
      {activations.map((activation, index) => {
        // Calculate X offset based on nesting level
        const xOffset = activation.level * ACTIVATION_OFFSET;
        const activationX = lineX - ACTIVATION_WIDTH / 2 + xOffset;

        return (
          <rect
            key={index}
            x={activationX}
            y={shape.y + activation.startY}
            width={ACTIVATION_WIDTH}
            height={activation.endY - activation.startY}
            fill="white"
            stroke="#000"
            strokeWidth={1}
            pointerEvents="none"
          />
        );
      })}

      {/* Connection points (every 20px along the lifeline) */}
      {Array.from({ length: Math.floor(shape.height / 20) }).map((_, index) => {
        const connectionPointY = shape.y + HEADER_HEIGHT + index * 20;
        const connectionPointId = `${shape.id}-cp-${index}`;

        return (
          <circle
            key={connectionPointId}
            cx={lineX}
            cy={connectionPointY}
            r={4}
            fill={isHovered ? '#3b82f6' : 'transparent'}
            stroke="transparent"
            strokeWidth={8} // Large hit area
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => onConnectionPointMouseDown?.(connectionPointId, e)}
            onMouseUp={(e) => onConnectionPointMouseUp?.(connectionPointId, e)}
          />
        );
      })}
    </g>
  );
}
```

**Key Implementation Details:**

1. **Activation Rendering**: Reads `shape.data.activations` array to draw activation boxes
2. **Nesting Offset**: Each nesting level offsets activation box by 5px
3. **Connection Points**: Generates connection points every 20px along lifeline
4. **Dashed Line**: Uses `strokeDasharray="5,5"` for lifeline
5. **Header**: 120px × 50px rounded rectangle

#### 2.4 Message Connector Renderer

**Create: `app/design-studio/diagrams/sequence/components/MessageConnector.tsx`**

```typescript
import React from 'react';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { Shape } from '~/core/entities/design-studio/types/Shape';

interface MessageConnectorProps {
  connector: Connector;
  sourceShape: Shape | null;
  targetShape: Shape | null;
  isSelected: boolean;
  isHovered: boolean;
  isEditing: boolean;
  onMouseDown: (e: React.MouseEvent, connectorId: string) => void;
  onMouseEnter: (e: React.MouseEvent, connectorId: string) => void;
  onMouseLeave: (e: React.MouseEvent, connectorId: string) => void;
  onDoubleClick: (connectorId: string) => void;
  onLabelChange: (connectorId: string, newLabel: string) => void;
  onFinishEditing: () => void;
}

const HEADER_HEIGHT = 50;
const LIFELINE_WIDTH = 120;

/**
 * Message Connector Renderer for Sequence Diagrams
 *
 * Message Types:
 * - sequence-message-sync: Solid line with solid arrowhead
 * - sequence-message-async: Solid line with open arrowhead
 * - sequence-message-return: Dashed line with open arrowhead
 */
export function MessageConnectorRenderer({
  connector,
  sourceShape,
  targetShape,
  isSelected,
  isHovered,
  isEditing,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onLabelChange,
  onFinishEditing,
}: MessageConnectorProps) {
  if (!sourceShape || !targetShape) return null;

  // Calculate message line coordinates
  const sourceX = sourceShape.x + LIFELINE_WIDTH / 2;
  const targetX = targetShape.x + LIFELINE_WIDTH / 2;

  // Messages are drawn horizontally at the same Y level
  // Use connector's stored Y position or calculate from shapes
  const y = sourceShape.y + HEADER_HEIGHT + 20; // Default offset

  // Determine line style based on message type
  const isReturn = connector.type === 'sequence-message-return';
  const isSync = connector.type === 'sequence-message-sync';
  const strokeDasharray = isReturn ? '5,5' : undefined;

  // Calculate arrowhead
  const arrowLength = 10;
  const arrowWidth = 6;
  const isLeftToRight = targetX > sourceX;
  const arrowDir = isLeftToRight ? 1 : -1;

  const arrowTipX = targetX;
  const arrowTipY = y;
  const arrowBaseX = targetX - arrowDir * arrowLength;

  return (
    <g>
      {/* Message line */}
      <line
        x1={sourceX}
        y1={y}
        x2={targetX - arrowDir * arrowLength}
        y2={y}
        stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#000'}
        strokeWidth={isSelected ? 2 : 1}
        strokeDasharray={strokeDasharray}
        onMouseDown={(e) => onMouseDown(e, connector.id)}
        onMouseEnter={(e) => onMouseEnter(e, connector.id)}
        onMouseLeave={(e) => onMouseLeave(e, connector.id)}
        onDoubleClick={() => onDoubleClick(connector.id)}
        style={{ cursor: 'pointer' }}
      />

      {/* Arrowhead */}
      {isSync ? (
        // Solid arrowhead for sync messages
        <polygon
          points={`${arrowTipX},${arrowTipY} ${arrowBaseX},${arrowTipY - arrowWidth} ${arrowBaseX},${arrowTipY + arrowWidth}`}
          fill={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#000'}
          stroke="none"
          pointerEvents="none"
        />
      ) : (
        // Open arrowhead for async and return messages
        <>
          <line
            x1={arrowTipX}
            y1={arrowTipY}
            x2={arrowBaseX}
            y2={arrowTipY - arrowWidth}
            stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#000'}
            strokeWidth={isSelected ? 2 : 1}
            pointerEvents="none"
          />
          <line
            x1={arrowTipX}
            y1={arrowTipY}
            x2={arrowBaseX}
            y2={arrowTipY + arrowWidth}
            stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#000'}
            strokeWidth={isSelected ? 2 : 1}
            pointerEvents="none"
          />
        </>
      )}

      {/* Label */}
      {connector.label && !isEditing && (
        <text
          x={(sourceX + targetX) / 2}
          y={y - 5}
          textAnchor="middle"
          dominantBaseline="baseline"
          fontSize={12}
          fill="#000"
          pointerEvents="none"
        >
          {connector.label}
        </text>
      )}

      {/* Editable label */}
      {isEditing && (
        <foreignObject
          x={(sourceX + targetX) / 2 - 50}
          y={y - 25}
          width={100}
          height={20}
        >
          <input
            type="text"
            value={connector.label || ''}
            onChange={(e) => onLabelChange(connector.id, e.target.value)}
            onBlur={onFinishEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onFinishEditing();
            }}
            autoFocus
            style={{
              width: '100%',
              fontSize: '12px',
              textAlign: 'center',
              border: '1px solid #3b82f6',
              borderRadius: '2px',
              padding: '2px',
            }}
          />
        </foreignObject>
      )}

      {/* Invisible wider line for easier clicking */}
      <line
        x1={sourceX}
        y1={y}
        x2={targetX}
        y2={y}
        stroke="transparent"
        strokeWidth={10}
        onMouseDown={(e) => onMouseDown(e, connector.id)}
        onMouseEnter={(e) => onMouseEnter(e, connector.id)}
        onMouseLeave={(e) => onMouseLeave(e, connector.id)}
        onDoubleClick={() => onDoubleClick(connector.id)}
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
}
```

**Key Implementation Details:**

1. **Message Types**: Sync (solid arrow), async (open arrow), return (dashed + open arrow)
2. **Horizontal Layout**: All messages drawn horizontally
3. **Arrow Calculation**: 10px length, 6px width, direction based on source/target X
4. **Hit Area**: Transparent 10px wide line for easier clicking
5. **Label Positioning**: Centered above message line

#### 2.5 Lifeline Controls

**Create: `app/design-studio/components/canvas/ui/LifelineControls.tsx`**

```typescript
import React from 'react';

interface LifelineControlsProps {
  onExtend: () => void;
  onShrink: () => void;
  canShrink: boolean;
  shrinkDisabledReason?: string;
}

/**
 * Lifeline Controls Component
 *
 * Displays extend/shrink buttons for sequence diagram lifelines
 * Shows tooltip when shrinking is disabled
 */
export function LifelineControls({
  onExtend,
  onShrink,
  canShrink,
  shrinkDisabledReason,
}: LifelineControlsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        gap: '8px',
        background: 'white',
        padding: '8px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 100,
      }}
    >
      <button
        onClick={onExtend}
        style={{
          padding: '6px 12px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
        title="Extend all lifelines by 100px"
      >
        ↓ Extend Lifelines
      </button>

      <button
        onClick={onShrink}
        disabled={!canShrink}
        style={{
          padding: '6px 12px',
          background: canShrink ? '#10b981' : '#d1d5db',
          color: canShrink ? 'white' : '#9ca3af',
          border: 'none',
          borderRadius: '4px',
          cursor: canShrink ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: 500,
        }}
        title={canShrink ? 'Shrink all lifelines by 100px' : shrinkDisabledReason}
      >
        ↑ Shrink Lifelines
      </button>
    </div>
  );
}
```

#### 2.6 Diagram Features Integration

**Create: `app/design-studio/diagrams/sequence/features.ts`**

```typescript
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import { calculateAllLifelineActivations } from './activationCalculator';
import { canShrinkLifelines, LIFELINE_EXTENSION_INCREMENT, DEFAULT_LIFELINE_HEIGHT } from './heightCalculator';

/**
 * Sequence Diagram Features
 *
 * Implements diagram-specific behaviors:
 * - Auto-calculate activation boxes when connectors change
 * - Provide extend/shrink lifeline handlers
 */
export const sequenceDiagramFeatures = {
  /**
   * Recalculate activation boxes whenever connectors change
   */
  onConnectorsChanged: (
    shapes: Shape[],
    connectors: Connector[],
    updateShape: (id: string, updates: Partial<Shape>) => void
  ) => {
    const activationsMap = calculateAllLifelineActivations(shapes, connectors);

    activationsMap.forEach((newActivations, shapeId) => {
      const shape = shapes.find((s) => s.id === shapeId);
      if (!shape) return;

      const currentActivations = (shape.data as { activations?: unknown })?.activations || [];

      // Only update if activations changed
      const changed = JSON.stringify(currentActivations) !== JSON.stringify(newActivations);
      if (changed) {
        updateShape(shapeId, {
          data: {
            ...(shape.data || {}),
            activations: newActivations,
          },
        });
      }
    });
  },

  /**
   * Get control handlers for lifeline operations
   */
  getControlHandlers: (context: {
    shapes: Shape[];
    connectors: Connector[];
    updateShape: (id: string, updates: Partial<Shape>) => void;
  }) => {
    const { shapes, updateShape } = context;

    return {
      onExtendLifelines: () => {
        const lifelines = shapes.filter((s) => s.type === 'sequence-lifeline');
        lifelines.forEach((lifeline) => {
          updateShape(lifeline.id, {
            height: lifeline.height + LIFELINE_EXTENSION_INCREMENT,
          });
        });
      },

      onShrinkLifelines: () => {
        const lifelines = shapes.filter((s) => s.type === 'sequence-lifeline');
        lifelines.forEach((lifeline) => {
          const newHeight = Math.max(
            DEFAULT_LIFELINE_HEIGHT,
            lifeline.height - LIFELINE_EXTENSION_INCREMENT
          );
          updateShape(lifeline.id, { height: newHeight });
        });
      },

      canShrink: () => canShrinkLifelines(shapes, context.connectors),
    };
  },
};
```

---

## 3. Intelligent Parent-Child Containment 🔴

### Current State Analysis

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
```typescript
// Real-time containment detection with visual feedback
// Throttled to 30fps during drag
// Prevents circular relationships
// Finds deepest valid container
```

### Implementation Guide

#### 3.1 Containment Utilities

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

#### 3.2 Throttle Utility

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

#### 3.3 Integration into useShapeDragging

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

## 4. Diagram Features System 🟡

### Current State Analysis

**Tinkersaur-App:**
- No extensible architecture for diagram-specific behaviors
- Diagram logic scattered across components
- Hard to add new diagram types
- No lifecycle hooks

**VS Code Extension:**
- Clean `DiagramFeatures` interface
- Pluggable per-diagram behaviors
- Lifecycle hooks for shape/connector changes
- Custom control rendering

### Implementation Guide

#### 4.1 DiagramFeatures Interface

**Update: `app/core/entities/design-studio/types/DiagramConfig.ts`**

```typescript
import type { Shape } from './Shape';
import type { Connector } from './Connector';
import type { Group } from './Group';

/**
 * Diagram-specific features and behaviors
 *
 * Allows each diagram type to define custom logic that runs
 * at specific lifecycle points.
 */
export interface DiagramFeatures {
  /**
   * Called whenever connectors change
   *
   * Use case: Sequence diagrams recalculate activation boxes
   *
   * @param shapes - Current shapes
   * @param connectors - Current connectors
   * @param updateShape - Function to update a shape
   */
  onConnectorsChanged?: (
    shapes: Shape[],
    connectors: Connector[],
    updateShape: (id: string, updates: Partial<Shape>) => void
  ) => void;

  /**
   * Called whenever shapes change
   *
   * Use case: Update derived state based on shape modifications
   */
  onShapesChanged?: (
    shapes: Shape[],
    updateShape: (id: string, updates: Partial<Shape>) => void
  ) => void;

  /**
   * Called whenever groups change
   */
  onGroupsChanged?: (
    groups: Group[],
    updateGroup: (id: string, updates: Partial<Group>) => void
  ) => void;

  /**
   * Get diagram-specific control handlers
   *
   * Use case: Sequence diagrams provide extend/shrink lifeline handlers
   *
   * @param context - Current diagram state and update functions
   * @returns Object with handler functions
   */
  getControlHandlers?: (context: {
    shapes: Shape[];
    connectors: Connector[];
    groups: Group[];
    updateShape: (id: string, updates: Partial<Shape>) => void;
    updateConnector: (id: string, updates: Partial<Connector>) => void;
    updateGroup: (id: string, updates: Partial<Group>) => void;
  }) => Record<string, Function>;

  /**
   * Render diagram-specific UI controls
   *
   * Use case: Sequence diagrams render lifeline extend/shrink buttons
   *
   * @param props - Context and handlers
   * @returns React element or null
   */
  renderDiagramControls?: (props: DiagramControlsProps) => React.ReactNode;
}

/**
 * Props passed to renderDiagramControls
 */
export interface DiagramControlsProps {
  shapes: Shape[];
  connectors: Connector[];
  groups: Group[];
  handlers?: Record<string, Function>;
}

/**
 * Diagram configuration
 */
export interface DiagramConfig {
  type: string;
  shapes: {
    definitions: ShapeDefinition[];
    categories: ShapeCategory[];
    renderer: (shape: Shape, props: ShapeRenderProps) => JSX.Element;
  };
  connectors: {
    definitions: ConnectorDefinition[];
    defaultType: string;
    renderer: (connector: Connector, props: ConnectorRenderProps) => JSX.Element;
  };
  mermaid: {
    exporter: DiagramExporter;
    importer: DiagramImporter;
    detector: (content: string) => boolean;
  };
  ui: {
    gridDefaults: {
      type: 'dot' | 'line';
      size: number;
    };
    zoomDefaults: {
      min: number;
      max: number;
      default: number;
    };
  };
  features: {
    supportsGroups: boolean;
    diagramFeatures?: DiagramFeatures; // NEW
  };
}
```

#### 4.2 Diagram Features Execution Hook

**Create: `app/design-studio/hooks/useDiagramFeatures.ts`**

```typescript
import { useEffect, useRef } from 'react';
import type { DiagramFeatures } from '~/core/entities/design-studio/types/DiagramConfig';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { Group } from '~/core/entities/design-studio/types/Group';

interface UseDiagramFeaturesProps {
  diagramFeatures?: DiagramFeatures;
  shapes: Shape[];
  connectors: Connector[];
  groups: Group[];
  updateShape: (id: string, updates: Partial<Shape>) => void;
  updateConnector: (id: string, updates: Partial<Connector>) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
}

/**
 * Hook to execute diagram-specific features at appropriate lifecycle points
 *
 * Tracks changes to shapes, connectors, and groups and calls the appropriate
 * feature hooks when they change.
 */
export function useDiagramFeatures({
  diagramFeatures,
  shapes,
  connectors,
  groups,
  updateShape,
  updateConnector,
  updateGroup,
}: UseDiagramFeaturesProps) {
  // Track previous values to detect changes
  const prevConnectorsRef = useRef<Connector[]>(connectors);
  const prevShapesRef = useRef<Shape[]>(shapes);
  const prevGroupsRef = useRef<Group[]>(groups);

  // Execute onConnectorsChanged when connectors change
  useEffect(() => {
    if (!diagramFeatures?.onConnectorsChanged) return;

    // Check if connectors actually changed (deep comparison of persistent state)
    const connectorsChanged = JSON.stringify(connectors) !== JSON.stringify(prevConnectorsRef.current);

    if (connectorsChanged) {
      diagramFeatures.onConnectorsChanged(shapes, connectors, updateShape);
      prevConnectorsRef.current = connectors;
    }
  }, [connectors, shapes, updateShape, diagramFeatures]);

  // Execute onShapesChanged when shapes change
  useEffect(() => {
    if (!diagramFeatures?.onShapesChanged) return;

    const shapesChanged = JSON.stringify(shapes) !== JSON.stringify(prevShapesRef.current);

    if (shapesChanged) {
      diagramFeatures.onShapesChanged(shapes, updateShape);
      prevShapesRef.current = shapes;
    }
  }, [shapes, updateShape, diagramFeatures]);

  // Execute onGroupsChanged when groups change
  useEffect(() => {
    if (!diagramFeatures?.onGroupsChanged) return;

    const groupsChanged = JSON.stringify(groups) !== JSON.stringify(prevGroupsRef.current);

    if (groupsChanged) {
      diagramFeatures.onGroupsChanged(groups, updateGroup);
      prevGroupsRef.current = groups;
    }
  }, [groups, updateGroup, diagramFeatures]);
}
```

#### 4.3 Integration into Canvas Controller

**Update: `app/design-studio/components/canvas/core/CanvasController.tsx`**

```typescript
import { useDiagramFeatures } from '../../../hooks/useDiagramFeatures';

export function CanvasController({ diagramId }: CanvasControllerProps) {
  // ... existing code

  const {
    shapes,
    connectors,
    groups,
    updateShape,
    updateConnector,
    updateGroup,
  } = useCanvasState({ diagramId });

  const { diagramConfig } = useDiagramConfig(diagramType);

  // Execute diagram features
  useDiagramFeatures({
    diagramFeatures: diagramConfig.features.diagramFeatures,
    shapes,
    connectors,
    groups,
    updateShape,
    updateConnector,
    updateGroup,
  });

  // Get control handlers from diagram features
  const diagramHandlers = diagramConfig.features.diagramFeatures?.getControlHandlers?.({
    shapes,
    connectors,
    groups,
    updateShape,
    updateConnector,
    updateGroup,
  });

  // ... rest of component

  return (
    <DiagramContext.Provider value={{ /* ... */ }}>
      <ViewportContext.Provider value={{ /* ... */ }}>
        <SelectionContext.Provider value={{ /* ... */ }}>
          <EventsContext.Provider value={{ /* ... */ }}>

            {/* Render diagram-specific controls */}
            {diagramConfig.features.diagramFeatures?.renderDiagramControls?.({
              shapes,
              connectors,
              groups,
              handlers: diagramHandlers,
            })}

            {children}
          </EventsContext.Provider>
        </SelectionContext.Provider>
      </ViewportContext.Provider>
    </DiagramContext.Provider>
  );
}
```

---

## 5. Bidirectional Content Synchronization 🟡

### Current State Analysis

**Tinkersaur-App:**
- Manual import via commands
- Manual export on save
- No automatic synchronization
- No prevention of circular updates

**VS Code Extension:**
- Auto-import when content changes externally
- Auto-export (debounced) when diagram changes
- Circular update prevention
- Transient state filtering

### Implementation Guide

#### 5.1 Content Sync Hook

**Create: `app/design-studio/hooks/useContentSync.ts`**

```typescript
import { useEffect, useRef, useState } from 'react';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { Group } from '~/core/entities/design-studio/types/Group';
import type { DiagramConfig } from '~/core/entities/design-studio/types/DiagramConfig';

interface UseContentSyncProps {
  content: string;
  onContentChange: (content: string) => void;
  config: DiagramConfig;
  shapes: Shape[];
  connectors: Connector[];
  groups: Group[];
  setShapes: (shapes: Shape[]) => void;
  setConnectors: (connectors: Connector[]) => void;
  setGroups: (groups: Group[]) => void;
}

interface UseContentSyncReturn {
  metadata: {
    title: string;
    diagramType: string;
  };
  setMetadata: React.Dispatch<React.SetStateAction<{
    title: string;
    diagramType: string;
  }>>;
}

/**
 * Hook for managing bidirectional content synchronization
 *
 * Key Features:
 * - Imports content from Mermaid when content prop changes
 * - Exports to Mermaid (debounced 150ms) when shapes/connectors/groups change
 * - Prevents circular updates using loading ref
 * - Filters transient state (isSelected, isHovered) before comparison
 * - Manages metadata (title, diagram type)
 */
export function useContentSync({
  content,
  onContentChange,
  config,
  shapes,
  connectors,
  groups,
  setShapes,
  setConnectors,
  setGroups,
}: UseContentSyncProps): UseContentSyncReturn {
  const [metadata, setMetadata] = useState({ title: 'Untitled', diagramType: 'bpmn' });

  // Track if we're loading to prevent circular updates
  const isLoadingRef = useRef(false);
  const lastContentRef = useRef(content);
  const lastPersistentStateRef = useRef<string>('');

  // Store importer/exporter refs
  const importerRef = useRef(config.mermaid.importer);
  const exporterRef = useRef(config.mermaid.exporter);

  // Update importer/exporter when config changes
  useEffect(() => {
    importerRef.current = config.mermaid.importer;
    exporterRef.current = config.mermaid.exporter;
  }, [config]);

  /**
   * Parse content when it changes from external source
   *
   * This effect runs when:
   * - File is first loaded
   * - User switches between files
   * - External changes to the file (e.g., git pull)
   */
  useEffect(() => {
    if (content !== lastContentRef.current) {
      // Set loading flag to prevent export during import
      isLoadingRef.current = true;

      // Import content
      const result = importerRef.current.import(content);

      setMetadata({
        title: result.metadata?.title || 'Untitled',
        diagramType: result.metadata?.diagramType || 'bpmn'
      });
      setShapes(result.shapes);
      setConnectors(result.connectors);
      setGroups(result.groups || []);

      lastContentRef.current = content;

      // Initialize persistent state ref to match imported content
      // This prevents the first interaction from triggering an export
      const persistentShapes = result.shapes.map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );
      const persistentConnectors = result.connectors.map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );
      const persistentGroups = (result.groups || []).map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );

      lastPersistentStateRef.current = JSON.stringify({
        shapes: persistentShapes,
        connectors: persistentConnectors,
        groups: persistentGroups,
        metadata: {
          title: result.metadata?.title || 'Untitled',
          diagramType: result.metadata?.diagramType || 'bpmn'
        }
      });

      // Allow exports again after a short delay
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }
  }, [content, setShapes, setConnectors, setGroups]);

  /**
   * Export shapes/connectors/groups to content (debounced)
   *
   * This effect runs when:
   * - User adds/removes/modifies shapes
   * - User adds/removes/modifies connectors
   * - User adds/removes/modifies groups
   * - Metadata changes
   *
   * Key Features:
   * - 150ms debounce to avoid excessive exports
   * - Filters transient state (isSelected, isHovered) before comparison
   * - Only exports if persistent state actually changed
   */
  useEffect(() => {
    // Don't export while loading
    if (isLoadingRef.current) return;

    const timeout = setTimeout(() => {
      // Create versions without transient state for comparison
      const persistentShapes = shapes.map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );
      const persistentConnectors = connectors.map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );
      const persistentGroups = groups.map(
        ({ isSelected: _isSelected, isHovered: _isHovered, ...persistent }) => persistent
      );

      // Create stable comparison key from persistent state only
      const persistentStateKey = JSON.stringify({
        shapes: persistentShapes,
        connectors: persistentConnectors,
        groups: persistentGroups,
        metadata
      });

      // Only export if persistent state changed
      if (persistentStateKey === lastPersistentStateRef.current) {
        return;
      }

      lastPersistentStateRef.current = persistentStateKey;

      // Export to Mermaid
      const result = exporterRef.current.export(shapes, connectors, metadata, groups);

      if (result.content !== lastContentRef.current) {
        lastContentRef.current = result.content;
        onContentChange(result.content);
      }
    }, 150); // 150ms debounce

    return () => clearTimeout(timeout);
  }, [shapes, connectors, groups, metadata, onContentChange]);

  return {
    metadata,
    setMetadata,
  };
}
```

**Key Implementation Details:**

1. **Loading Flag**: `isLoadingRef` prevents circular updates during import
2. **Debouncing**: 150ms timeout prevents excessive exports during rapid changes
3. **Transient State Filtering**: Removes `isSelected`/`isHovered` before comparison
4. **Persistent State Tracking**: Only exports when actual diagram data changes
5. **Metadata Management**: Syncs title and diagram type
6. **Initial State Prevention**: Initializes `lastPersistentStateRef` to prevent export on first render

#### 5.2 Integration Example

**Usage in Canvas Component:**

```typescript
import { useContentSync } from '../../hooks/useContentSync';

export function Canvas({ diagramId, content, onContentChange }: CanvasProps) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const { config } = useDiagramConfig(diagramType);

  // Set up bidirectional sync
  const { metadata, setMetadata } = useContentSync({
    content,
    onContentChange,
    config,
    shapes,
    connectors,
    groups,
    setShapes,
    setConnectors,
    setGroups,
  });

  // ... rest of component
}
```

---

## Summary of Development Work

### Files to Create

#### Group/Swimlane System
1. `app/design-studio/utils/swimlaneSnapping.ts` (~280 lines)
2. `app/design-studio/hooks/useGroupDragging.ts` (~195 lines)
3. `app/design-studio/hooks/useGroupResizing.ts` (~150 lines)
4. `app/design-studio/diagrams/bpmn/components/BpmnSwimlane.tsx` (~200 lines)
5. `app/design-studio/hooks/useGroupInteraction.ts` (~100 lines)

#### Sequence Diagrams
6. `app/design-studio/diagrams/sequence/activationCalculator.ts` (~150 lines)
7. `app/design-studio/diagrams/sequence/heightCalculator.ts` (~80 lines)
8. `app/design-studio/diagrams/sequence/components/SequenceLifeline.tsx` (~180 lines)
9. `app/design-studio/diagrams/sequence/components/MessageConnector.tsx` (~150 lines)
10. `app/design-studio/components/canvas/ui/LifelineControls.tsx` (~70 lines)
11. `app/design-studio/diagrams/sequence/features.ts` (~100 lines)
12. `app/design-studio/diagrams/sequence/config.tsx` (~170 lines)

#### Containment System
13. `app/design-studio/utils/containment-utils.ts` (~150 lines)
14. `app/design-studio/utils/throttle.ts` (~40 lines)

#### Diagram Features
15. `app/design-studio/hooks/useDiagramFeatures.ts` (~80 lines)

#### Content Sync
16. `app/design-studio/hooks/useContentSync.ts` (~160 lines)

### Files to Update

1. `app/design-studio/hooks/useCanvasEventOrchestrator.ts` - Add group modes and handlers
2. `app/design-studio/hooks/useInteractionState.ts` - Add dragging-group and resizing-group modes
3. `app/design-studio/hooks/useShapeDragging.ts` - Add containment detection
4. `app/design-studio/components/canvas/core/CanvasController.tsx` - Add diagram features execution
5. `app/design-studio/components/canvas/core/CanvasView.tsx` - Render group layer and controls
6. `app/core/entities/design-studio/types/DiagramConfig.ts` - Add DiagramFeatures interface

### Total Estimated Code

- **New Code**: ~1,900 lines
- **Modified Code**: ~500 lines
- **Total Impact**: ~2,400 lines

---

## Architecture Patterns to Follow

### 1. Hook Composition Pattern

```typescript
// Each interaction type gets its own focused hook
const dragging = useShapeDragging({ /* ... */ });
const groupDragging = useGroupDragging({ /* ... */ });
const resizing = useGroupResizing({ /* ... */ });

// Orchestrator composes them
const orchestrator = useCanvasEventOrchestrator({
  dragging,
  groupDragging,
  resizing,
  // ...
});
```

### 2. State Machine Pattern

```typescript
type Mode = 'idle' | 'dragging-shapes' | 'dragging-group' | 'resizing-group';

// Only one mode active at a time
const { mode, setMode } = useInteractionState();

// Hooks check if they're active
const isActive = mode === 'dragging-group';
```

### 3. Performance Optimization Pattern

```typescript
// Throttle expensive operations (visual feedback)
const throttled = useMemo(() => throttle(expensiveFunc, 33), []); // 30fps

// RAF batch frequent operations (position updates)
rafId = requestAnimationFrame(() => {
  applyUpdates();
}); // 60fps

// Cleanup
useEffect(() => () => {
  cancelAnimationFrame(rafId);
  throttled.cancel();
}, []);
```

### 4. Circular Update Prevention Pattern

```typescript
const isLoadingRef = useRef(false);
const lastStateRef = useRef('');

// When importing
isLoadingRef.current = true;
importData();
setTimeout(() => { isLoadingRef.current = false; }, 100);

// When exporting
if (isLoadingRef.current) return;
if (newState === lastStateRef.current) return;
exportData();
```

### 5. Diagram Features Pattern

```typescript
// Each diagram defines its features
export const bpmnFeatures: DiagramFeatures = {
  onConnectorsChanged: (shapes, connectors, updateShape) => {
    // BPMN-specific logic
  },
  getControlHandlers: (context) => ({
    onSomeBpmnAction: () => { /* ... */ }
  }),
  renderDiagramControls: (props) => <BpmnControls {...props} />
};

// Config includes features
export const bpmnConfig: DiagramConfig = {
  // ...
  features: {
    diagramFeatures: bpmnFeatures
  }
};
```

---

## Testing Strategy

### Unit Tests

1. **Swimlane Snapping**
   - Test adjacency detection with various positions
   - Test snap threshold behavior
   - Test dimension matching
   - Test border hiding logic

2. **Containment Utils**
   - Test descendant calculation
   - Test container detection with nested groups
   - Test circular relationship prevention

3. **Activation Calculator**
   - Test with various message patterns
   - Test nesting level calculation
   - Test return message matching

### Integration Tests

1. **Group Dragging**
   - Drag group and verify children move together
   - Test swimlane snapping behavior
   - Test grid snapping fallback

2. **Sequence Diagrams**
   - Add messages and verify activation boxes update
   - Extend/shrink lifelines and verify validation
   - Test height constraints

3. **Content Sync**
   - Modify diagram and verify export
   - Change content and verify import
   - Verify no circular updates
   - Verify transient state doesn't trigger export

### Performance Tests

1. Verify containment detection runs at 30fps during drag
2. Verify position updates run at 60fps
3. Verify export debouncing works (no more than 1 export per 150ms)
4. Test with large diagrams (100+ shapes)

---

## Migration Notes

### Backward Compatibility

All new features should be backward compatible:

1. **Groups**: Existing `parentGroupId` still works, just enhanced
2. **Sequence Diagrams**: Completely new, no migration needed
3. **Content Sync**: Opt-in via hook usage
4. **Diagram Features**: Opt-in per diagram type

### Feature Flags (Recommended)

```typescript
const FEATURE_FLAGS = {
  SWIMLANE_SNAPPING: true,
  SEQUENCE_DIAGRAMS: true,
  AUTO_CONTENT_SYNC: true,
  CONTAINMENT_DETECTION: true,
};

// Use in code
if (FEATURE_FLAGS.SWIMLANE_SNAPPING) {
  // New behavior
} else {
  // Old behavior
}
```

### Gradual Rollout

1. Implement features behind flags
2. Test thoroughly in development
3. Enable for internal users
4. Gather feedback
5. Enable for all users
6. Remove flags and old code

---

## Performance Targets

- **Containment Detection**: 30fps (33ms) during drag
- **Position Updates**: 60fps (16ms) during drag
- **Export Debounce**: 150ms maximum frequency
- **Activation Calculation**: <10ms for diagrams with <50 shapes
- **Swimlane Snapping**: <5ms per snap calculation

---

## Conclusion

This implementation guide provides detailed code examples, architecture patterns, and integration points for bringing tinkersaur-app to feature parity with the VS Code extension. The focus is on:

1. **Maintainability**: Clear separation of concerns, focused hooks
2. **Performance**: RAF batching, throttling, debouncing
3. **Extensibility**: Diagram features system for easy diagram type additions
4. **Robustness**: Circular update prevention, containment validation
5. **User Experience**: Real-time visual feedback, automatic synchronization

All implementations follow the established patterns in both codebases while adapting for the web application context (command pattern for undo/redo, etc.).
