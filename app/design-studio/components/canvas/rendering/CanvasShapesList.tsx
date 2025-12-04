import { useMemo } from 'react';
import type { Shape } from '~/core/entities/design-studio/types';
import type { ViewportTransform } from '../../../utils/viewport';
import { ShapeRenderer } from '~/design-studio/diagrams/shared/rendering/ShapeRenderer';
import type { RenderContext } from '~/design-studio/diagrams/shared/rendering/types';
import { ResizeHandles } from '../ui/ResizeHandles';
import { isContainerType } from '../../../utils/containment-utils';
import type { ResizeHandle } from '../../../utils/resize';
import {
  useOverlayVisibilityStore,
  isOverlayElementVisible,
} from '../../../store/overlay/overlayVisibilityStore';

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
  // Class shape editing callbacks
  onClassStereotypeChange?: (shapeId: string, stereotype: string | undefined) => void;
  onClassAddAttribute?: (shapeId: string) => void;
  onClassDeleteAttribute?: (shapeId: string, attributeIndex: number) => void;
  onClassUpdateAttribute?: (shapeId: string, attributeIndex: number, newValue: string) => void;
  onClassUpdateAttributeLocal?: (shapeId: string, attributeIndex: number, newValue: string) => void;
  onClassAddMethod?: (shapeId: string) => void;
  onClassDeleteMethod?: (shapeId: string, methodIndex: number) => void;
  onClassUpdateMethod?: (shapeId: string, methodIndex: number, newValue: string) => void;
  onClassUpdateMethodLocal?: (shapeId: string, methodIndex: number, newValue: string) => void;
  // Enumeration shape editing callbacks
  onEnumerationAddLiteral?: (shapeId: string) => void;
  onEnumerationDeleteLiteral?: (shapeId: string, literalIndex: number) => void;
  onEnumerationUpdateLiteral?: (shapeId: string, literalIndex: number, newValue: string) => void;
  onEnumerationUpdateLiteralLocal?: (shapeId: string, literalIndex: number, newValue: string) => void;
  // Resize callbacks
  onResizeStart?: (shapeId: string, handle: ResizeHandle, e: React.MouseEvent) => void;
}

/**
 * Renders all shapes on the canvas
 */
export function CanvasShapesList({
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
  onClassStereotypeChange,
  onClassAddAttribute,
  onClassDeleteAttribute,
  onClassUpdateAttribute,
  onClassUpdateAttributeLocal,
  onClassAddMethod,
  onClassDeleteMethod,
  onClassUpdateMethod,
  onClassUpdateMethodLocal,
  onEnumerationAddLiteral,
  onEnumerationDeleteLiteral,
  onEnumerationUpdateLiteral,
  onEnumerationUpdateLiteralLocal,
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
            onClassStereotypeChange={onClassStereotypeChange}
            onClassAddAttribute={onClassAddAttribute}
            onClassDeleteAttribute={onClassDeleteAttribute}
            onClassUpdateAttribute={onClassUpdateAttribute}
            onClassUpdateAttributeLocal={onClassUpdateAttributeLocal}
            onClassAddMethod={onClassAddMethod}
            onClassDeleteMethod={onClassDeleteMethod}
            onClassUpdateMethod={onClassUpdateMethod}
            onClassUpdateMethodLocal={onClassUpdateMethodLocal}
            onEnumerationAddLiteral={onEnumerationAddLiteral}
            onEnumerationDeleteLiteral={onEnumerationDeleteLiteral}
            onEnumerationUpdateLiteral={onEnumerationUpdateLiteral}
            onEnumerationUpdateLiteralLocal={onEnumerationUpdateLiteralLocal}
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
