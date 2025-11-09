/**
 * Connection Point System
 *
 * Defines flexible connection points for shapes with percentage-based positioning.
 * Connection points have both a position (where visually on the shape) and a direction
 * (which way connectors should exit for routing purposes).
 */

/**
 * Cardinal direction for connector routing.
 * Indicates which side of the shape the connection point is on.
 */
export type ConnectionPointDirection = 'N' | 'S' | 'E' | 'W';

/**
 * A connection point definition with flexible positioning.
 */
export interface ConnectionPoint {
  /** Unique identifier for this connection point */
  id: string;

  /**
   * Position as percentage of shape dimensions (0-1).
   * - x: 0 = left edge, 0.5 = center, 1 = right edge
   * - y: 0 = top edge, 0.5 = center, 1 = bottom edge
   */
  position: {
    x: number;
    y: number;
  };

  /**
   * Direction for routing purposes.
   * Indicates which way connectors should exit from this point.
   */
  direction: ConnectionPointDirection;
}

/**
 * Shape bounds for position calculation
 */
export interface ShapeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Absolute position in canvas coordinates
 */
export interface AbsolutePosition {
  x: number;
  y: number;
}

/**
 * Connection point with its calculated absolute position
 */
export interface PositionedConnectionPoint extends ConnectionPoint {
  absolutePosition: AbsolutePosition;
}

/**
 * Calculates the absolute position of a connection point on the canvas.
 *
 * @param connectionPoint - The connection point definition with percentage-based position
 * @param bounds - The shape's bounding box
 * @returns The absolute position in canvas coordinates
 */
export function calculateAbsolutePosition(
  connectionPoint: ConnectionPoint,
  bounds: ShapeBounds
): AbsolutePosition {
  return {
    x: bounds.x + connectionPoint.position.x * bounds.width,
    y: bounds.y + connectionPoint.position.y * bounds.height,
  };
}

/**
 * Finds a connection point by its ID.
 *
 * @param connectionPoints - Array of available connection points
 * @param id - The connection point ID to find
 * @returns The connection point or undefined if not found
 */
export function findConnectionPointById(
  connectionPoints: ConnectionPoint[],
  id: string
): ConnectionPoint | undefined {
  return connectionPoints.find((cp) => cp.id === id);
}

/**
 * Finds a connection point by its direction.
 * Returns the first connection point matching the direction.
 *
 * @param connectionPoints - Array of available connection points
 * @param direction - The direction to find
 * @returns The connection point or undefined if not found
 */
export function findConnectionPointByDirection(
  connectionPoints: ConnectionPoint[],
  direction: ConnectionPointDirection
): ConnectionPoint | undefined {
  return connectionPoints.find((cp) => cp.direction === direction);
}

/**
 * Calculates absolute positions for all connection points.
 *
 * @param connectionPoints - Array of connection point definitions
 * @param bounds - The shape's bounding box
 * @returns Array of connection points with calculated absolute positions
 */
export function calculateAllPositions(
  connectionPoints: ConnectionPoint[],
  bounds: ShapeBounds
): PositionedConnectionPoint[] {
  return connectionPoints.map((cp) => ({
    ...cp,
    absolutePosition: calculateAbsolutePosition(cp, bounds),
  }));
}

/**
 * Standard connection points for rectangular shapes (N, S, E, W at midpoints)
 */
export const STANDARD_RECTANGLE_CONNECTION_POINTS: ConnectionPoint[] = [
  { id: 'n', position: { x: 0.5, y: 0 }, direction: 'N' },
  { id: 's', position: { x: 0.5, y: 1 }, direction: 'S' },
  { id: 'e', position: { x: 1, y: 0.5 }, direction: 'E' },
  { id: 'w', position: { x: 0, y: 0.5 }, direction: 'W' },
];

/**
 * Standard connection points for shapes with only horizontal connections
 */
export const HORIZONTAL_CONNECTION_POINTS: ConnectionPoint[] = [
  { id: 'e', position: { x: 1, y: 0.5 }, direction: 'E' },
  { id: 'w', position: { x: 0, y: 0.5 }, direction: 'W' },
];

/**
 * Connection points for class shapes (positioned at quarter height)
 */
export const CLASS_CONNECTION_POINTS: ConnectionPoint[] = [
  { id: 'e', position: { x: 1, y: 0.35 }, direction: 'E' },
  { id: 'w', position: { x: 0, y: 0.35 }, direction: 'W' },
];

/**
 * Gets connection points for a shape based on its type.
 * Returns the appropriate connection point configuration for the shape.
 *
 * @param shapeType - The type of the shape
 * @returns Array of connection points for the shape
 */
export function getConnectionPointsForShape(shapeType: string): ConnectionPoint[] {
  // Class shapes use connection points at quarter height
  if (shapeType === 'class') {
    return CLASS_CONNECTION_POINTS;
  }

  // All other shapes use standard rectangle connection points
  return STANDARD_RECTANGLE_CONNECTION_POINTS;
}
