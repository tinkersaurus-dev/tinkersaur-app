import type { Shape } from '~/core/entities/design-studio';
import { ShapeRenderer } from '../../rendering/shapes/ShapeRenderer';
import type { RenderContext } from '../../rendering/shapes/types';

/**
 * Shape Layer Component
 *
 * Renders all shapes on the canvas.
 * Maps each shape to its appropriate renderer component.
 */

interface ShapeLayerProps {
  /** Array of shapes to render */
  shapes: Shape[];

  /** IDs of currently selected shapes */
  selectedShapeIds?: string[];

  /** ID of currently hovered shape */
  hoveredShapeId?: string | null;

  /** Current zoom level (for rendering context) */
  zoom?: number;

  /** Whether canvas is in read-only mode */
  readOnly?: boolean;

  /** Mouse down handler for shape selection */
  onShapeMouseDown?: (e: React.MouseEvent, shapeId: string) => void;

  /** Mouse enter handler for hover state */
  onShapeMouseEnter?: (e: React.MouseEvent, shapeId: string) => void;

  /** Mouse leave handler for hover state */
  onShapeMouseLeave?: (e: React.MouseEvent, shapeId: string) => void;
}

export function ShapeLayer({
  shapes,
  selectedShapeIds = [],
  hoveredShapeId = null,
  zoom = 1,
  readOnly = false,
  onShapeMouseDown,
  onShapeMouseEnter,
  onShapeMouseLeave,
}: ShapeLayerProps) {
  return (
    <>
      {shapes.map((shape) => {
        const context: RenderContext = {
          isSelected: selectedShapeIds.includes(shape.id),
          isHovered: shape.id === hoveredShapeId,
          zoom,
          readOnly,
        };

        return (
          <ShapeRenderer
            key={shape.id}
            shape={shape}
            context={context}
            onMouseDown={onShapeMouseDown}
            onMouseEnter={onShapeMouseEnter}
            onMouseLeave={onShapeMouseLeave}
          />
        );
      })}
    </>
  );
}
