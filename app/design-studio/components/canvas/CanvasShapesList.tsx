import type { Shape } from '~/core/entities/design-studio/types';
import { ShapeRenderer } from '../../rendering/shapes/ShapeRenderer';
import type { RenderContext } from '../../rendering/shapes/types';

interface CanvasShapesListProps {
  shapes: Shape[];
  selectedShapeIds: string[];
  hoveredShapeId: string | null;
  zoom: number;
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
}

/**
 * Renders all shapes on the canvas
 */
export function CanvasShapesList({
  shapes,
  selectedShapeIds,
  hoveredShapeId,
  zoom,
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
}: CanvasShapesListProps) {
  return (
    <>
      {shapes.map((shape) => {
        const shapeContext: RenderContext = {
          isSelected: selectedShapeIds.includes(shape.id),
          isHovered: shape.id === hoveredShapeId,
          zoom,
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
          />
        );
      })}
    </>
  );
}
