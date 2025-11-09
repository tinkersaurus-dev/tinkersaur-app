import type { Shape } from '~/core/entities/design-studio';
import type { ConnectionPoint } from '~/design-studio/utils/connectionPoints';

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
  onConnectionPointMouseDown?: (connectionPointId: string, e: React.MouseEvent) => void;
  onConnectionPointMouseUp?: (connectionPointId: string, e: React.MouseEvent) => void;

  /** Connection points defined by this shape */
  getConnectionPoints?: () => ConnectionPoint[];

  /** Class shape editing callbacks */
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
 * Shape Renderer Component Type
 *
 * All shape renderers should implement this interface.
 */
export type ShapeRendererComponent = React.FC<ShapeRendererProps>;
