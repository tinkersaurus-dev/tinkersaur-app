import type { Shape } from '~/core/entities/design-studio';
import type { ConnectionPointDirection } from '~/core/entities/design-studio/types/Connector';

/**
 * Shape Renderer Types
 *
 * Defines the interface for shape renderers and rendering context.
 */

/**
 * Rendering context passed to shape renderers
 *
 * Provides information about the rendering environment
 * that shape renderers may need.
 */
export interface RenderContext {
  /** Whether this shape is currently selected */
  isSelected: boolean;

  /** Whether this shape is currently hovered */
  isHovered: boolean;

  /** Current zoom level (for adjusting stroke widths, etc.) */
  zoom: number;

  /** Whether the canvas is in read-only mode */
  readOnly: boolean;
}

/**
 * Props passed to shape renderer components
 */
export interface ShapeRendererProps {
  /** The shape data to render */
  shape: Shape;

  /** Rendering context */
  context: RenderContext;

  /** Whether this shape is being edited */
  isEditing?: boolean;

  /** Optional event handlers */
  onMouseDown?: (e: React.MouseEvent, shapeId: string) => void;
  onMouseEnter?: (e: React.MouseEvent, shapeId: string) => void;
  onMouseLeave?: (e: React.MouseEvent, shapeId: string) => void;
  onDoubleClick?: (shapeId: string) => void;
  onLabelChange?: (entityId: string, entityType: 'shape' | 'connector', newLabel: string) => void;
  onFinishEditing?: () => void;

  /** Connection point event handlers (for creating connectors) */
  onConnectionPointMouseDown?: (
    pointId: string,
    direction: ConnectionPointDirection,
    e: React.MouseEvent
  ) => void;
  onConnectionPointMouseUp?: (
    pointId: string,
    direction: ConnectionPointDirection,
    e: React.MouseEvent
  ) => void;
}

/**
 * Shape Renderer Component Type
 *
 * All shape renderers should implement this interface.
 */
export type ShapeRendererComponent = React.FC<ShapeRendererProps>;
