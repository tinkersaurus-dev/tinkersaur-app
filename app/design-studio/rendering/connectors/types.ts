import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { Shape } from '~/core/entities/design-studio';

/**
 * Connector Renderer Types
 *
 * Defines the interface for connector renderers and rendering context.
 */

/**
 * Rendering context passed to connector renderers
 *
 * Provides information about the rendering environment
 * that connector renderers may need.
 */
export interface ConnectorRenderContext {
  /** Whether this connector is currently selected */
  isSelected: boolean;

  /** Whether this connector is currently hovered */
  isHovered: boolean;

  /** Current zoom level (for adjusting stroke widths, etc.) */
  zoom: number;

  /** Whether the canvas is in read-only mode */
  readOnly: boolean;

  /** All shapes on the canvas (for obstacle avoidance in routing) */
  allShapes?: Shape[];
}

/**
 * Props passed to connector renderer components
 */
export interface ConnectorRendererProps {
  /** The connector data to render */
  connector: Connector;

  /** The source shape that the connector starts from */
  sourceShape: Shape | undefined;

  /** The target shape that the connector ends at */
  targetShape: Shape | undefined;

  /** Rendering context */
  context: ConnectorRenderContext;

  /** Whether this connector is being edited */
  isEditing?: boolean;

  /** Optional event handlers */
  onMouseDown?: (e: React.MouseEvent, connectorId: string) => void;
  onMouseEnter?: (e: React.MouseEvent, connectorId: string) => void;
  onMouseLeave?: (e: React.MouseEvent, connectorId: string) => void;
  onDoubleClick?: (connectorId: string) => void;
  onLabelChange?: (entityId: string, entityType: 'shape' | 'connector', newLabel: string) => void;
  onFinishEditing?: () => void;
}

/**
 * Connector Renderer Component Type
 *
 * All connector renderers should implement this interface.
 */
export type ConnectorRendererComponent = React.FC<ConnectorRendererProps>;

/**
 * Connection point position
 */
export interface ConnectionPointPosition {
  x: number;
  y: number;
}

/**
 * Calculate connection point position based on shape and direction
 */
export function getConnectionPointPosition(
  shape: Shape,
  direction: 'N' | 'S' | 'E' | 'W'
): ConnectionPointPosition {
  const { x, y, width, height } = shape;

  switch (direction) {
    case 'N':
      return { x: x + width / 2, y };
    case 'S':
      return { x: x + width / 2, y: y + height };
    case 'E':
      return { x: x + width, y: y + height / 2 };
    case 'W':
      return { x, y: y + height / 2 };
  }
}
