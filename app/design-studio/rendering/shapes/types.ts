import type { Shape } from '~/core/entities/design-studio';

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

  /** Optional event handlers */
  onMouseDown?: (e: React.MouseEvent, shapeId: string) => void;
  onMouseEnter?: (e: React.MouseEvent, shapeId: string) => void;
  onMouseLeave?: (e: React.MouseEvent, shapeId: string) => void;
}

/**
 * Shape Renderer Component Type
 *
 * All shape renderers should implement this interface.
 */
export type ShapeRendererComponent = React.FC<ShapeRendererProps>;
