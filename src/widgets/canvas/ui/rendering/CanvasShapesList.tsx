import { useMemo, memo } from 'react';
import type { Shape } from '@/entities/shape';
import type { ViewportTransform } from '../../lib/utils/viewport';
import { ShapeRenderer } from '@/features/diagram-rendering/shared/rendering/ShapeRenderer';
import type { RenderContext } from '@/features/diagram-rendering/shared/rendering/types';
import { ResizeHandles } from '../primitives/ResizeHandles';
import { isContainerType } from '../../lib/utils/containment-utils';
import type { ResizeHandle } from '../../lib/utils/resize';
import {
  useOverlayVisibilityStore,
  isOverlayElementVisible,
} from '@/app/model/stores/overlay/overlayVisibilityStore';

interface CanvasShapesListProps {
  shapes: Shape[];
  selectedShapeIds: string[];
  hoveredShapeId: string | null;
  hoveredContainerId: string | null;
  viewportTransform: ViewportTransform;
  editingEntityId: string | null;
  editingEntityType: 'shape' | 'connector' | null;
  onMouseDown: (e: React.MouseEvent, shapeId: string) => void;
  onMouseEnter: (e: React.MouseEvent, shapeId: string) => void;
  onMouseLeave: (e: React.MouseEvent, shapeId: string) => void;
  onDoubleClick: (shapeId: string) => void;
  onLabelChange: (entityId: string, entityType: 'shape' | 'connector', newLabel: string) => void;
  onFinishEditing: () => void;
  onConnectionPointMouseDown: (connectionPointId: string, e: React.MouseEvent) => void;
  onConnectionPointMouseUp: (connectionPointId: string, e: React.MouseEvent) => Promise<void>;
  // Resize callbacks
  onResizeStart?: (shapeId: string, handle: ResizeHandle, e: React.MouseEvent) => void;
  // Note: Class and enumeration editing callbacks are consumed directly via useCanvasEvents()
}

/**
 * Custom comparison function for React.memo
 * Only re-render if props that affect rendering have actually changed
 */
function arePropsEqual(
  prevProps: CanvasShapesListProps,
  nextProps: CanvasShapesListProps
): boolean {
  // Check shapes array by reference (from useMemo in parent)
  if (prevProps.shapes !== nextProps.shapes) return false;

  // Compare selection arrays by content
  if (prevProps.selectedShapeIds.length !== nextProps.selectedShapeIds.length) return false;
  for (let i = 0; i < prevProps.selectedShapeIds.length; i++) {
    if (prevProps.selectedShapeIds[i] !== nextProps.selectedShapeIds[i]) return false;
  }

  // Compare primitive values
  if (prevProps.hoveredShapeId !== nextProps.hoveredShapeId) return false;
  if (prevProps.hoveredContainerId !== nextProps.hoveredContainerId) return false;
  if (prevProps.editingEntityId !== nextProps.editingEntityId) return false;
  if (prevProps.editingEntityType !== nextProps.editingEntityType) return false;

  // Only compare viewport zoom (the only value used for rendering)
  if (prevProps.viewportTransform.viewport.zoom !== nextProps.viewportTransform.viewport.zoom) {
    return false;
  }

  // Callbacks are from useCallback, assume stable
  // If they change, it's intentional and we should re-render
  if (prevProps.onMouseDown !== nextProps.onMouseDown) return false;
  if (prevProps.onMouseEnter !== nextProps.onMouseEnter) return false;
  if (prevProps.onMouseLeave !== nextProps.onMouseLeave) return false;
  if (prevProps.onDoubleClick !== nextProps.onDoubleClick) return false;
  if (prevProps.onLabelChange !== nextProps.onLabelChange) return false;
  if (prevProps.onFinishEditing !== nextProps.onFinishEditing) return false;
  if (prevProps.onConnectionPointMouseDown !== nextProps.onConnectionPointMouseDown) return false;
  if (prevProps.onConnectionPointMouseUp !== nextProps.onConnectionPointMouseUp) return false;
  if (prevProps.onResizeStart !== nextProps.onResizeStart) return false;

  return true;
}

/**
 * Renders all shapes on the canvas
 */
function CanvasShapesListComponent({
  shapes,
  selectedShapeIds,
  hoveredShapeId,
  hoveredContainerId,
  viewportTransform,
  editingEntityId,
  editingEntityType,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onLabelChange,
  onFinishEditing,
  onConnectionPointMouseDown,
  onConnectionPointMouseUp,
  onResizeStart,
}: CanvasShapesListProps) {
  // Get overlay visibility state
  const visibleOverlays = useOverlayVisibilityStore((state) => state.visibleOverlays);

  // Sort shapes to ensure parents render before children (depth-first traversal)
  // This ensures children appear above their parents in the rendering order
  // Also filter out shapes whose overlay is hidden
  const sortedShapes = useMemo(() => {
    const shapeMap = new Map(shapes.map(s => [s.id, s]));
    const visited = new Set<string>();
    const sorted: Shape[] = [];

    // Helper to recursively visit shapes depth-first
    const visit = (shape: Shape) => {
      if (visited.has(shape.id)) return;
      visited.add(shape.id);

      // Only include shape if its overlay is visible (or it has no overlay)
      if (isOverlayElementVisible(shape.overlayTag, visibleOverlays)) {
        sorted.push(shape);
      }

      // Then render all its children (so they appear on top)
      if (shape.children) {
        for (const childId of shape.children) {
          const child = shapeMap.get(childId);
          if (child) {
            visit(child);
          }
        }
      }
    };

    // Visit shapes that have no parent first (root shapes)
    for (const shape of shapes) {
      if (!shape.parentId) {
        visit(shape);
      }
    }

    // Visit any remaining shapes (shouldn't happen in well-formed data)
    for (const shape of shapes) {
      if (!visited.has(shape.id)) {
        visit(shape);
      }
    }

    return sorted;
  }, [shapes, visibleOverlays]);

  return (
    <>
      {sortedShapes.map((shape) => {
        const shapeContext: RenderContext = {
          isSelected: selectedShapeIds.includes(shape.id),
          isHovered: shape.id === hoveredShapeId,
          isHoveredContainer: shape.id === hoveredContainerId,
          zoom: viewportTransform.viewport.zoom,
          readOnly: false,
        };

        const isEditing = editingEntityId === shape.id && editingEntityType === 'shape';

        return (
          <ShapeRenderer
            key={shape.id}
            shape={shape}
            context={shapeContext}
            isEditing={isEditing}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onDoubleClick={onDoubleClick}
            onLabelChange={onLabelChange}
            onFinishEditing={onFinishEditing}
            onConnectionPointMouseDown={onConnectionPointMouseDown}
            onConnectionPointMouseUp={onConnectionPointMouseUp}
          />
        );
      })}

      {/* Render resize handles for selected container shapes */}
      {onResizeStart &&
        sortedShapes
          .filter(
            (shape) =>
              selectedShapeIds.includes(shape.id) && isContainerType(shape.type)
          )
          .map((shape) => (
            <ResizeHandles
              key={`resize-${shape.id}`}
              shape={shape}
              zoom={viewportTransform.viewport.zoom}
              onResizeStart={onResizeStart}
            />
          ))}
    </>
  );
}

/**
 * Memoized CanvasShapesList to prevent unnecessary re-renders
 * This is critical for performance - prevents re-rendering all shapes when
 * unrelated state changes (e.g., menu state, toolbar updates)
 */
export const CanvasShapesList = memo(CanvasShapesListComponent, arePropsEqual);
