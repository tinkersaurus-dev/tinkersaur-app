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

  /**
   * Optional fixed offset in pixels (used for sequence lifelines).
   * When present, this overrides the percentage-based positioning for the Y coordinate.
   */
  fixedOffsetY?: number;
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
    y: connectionPoint.fixedOffsetY !== undefined
      ? bounds.y + connectionPoint.fixedOffsetY
      : bounds.y + connectionPoint.position.y * bounds.height,
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
 * Connection points for sequence diagram lifelines
 * Uses index-based IDs and fixed pixel offsets for stable positioning
 * Connection points are placed every 40 pixels along the lifeline starting at 80px
 */
export const SEQUENCE_LIFELINE_CONNECTION_POINTS: ConnectionPoint[] = [
  // Top and bottom on participant box (still percentage-based)
  { id: 'n', position: { x: 0.5, y: 0 }, direction: 'N' },
  { id: 's', position: { x: 0.5, y: 0.15 }, direction: 'S' }, // Just below participant box
  // Connection points along the lifeline (index-based with fixed offsets)
  { id: 'e-0', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 80 },
  { id: 'w-0', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 80 },
  { id: 'e-1', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 120 },
  { id: 'w-1', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 120 },
  { id: 'e-2', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 160 },
  { id: 'w-2', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 160 },
  { id: 'e-3', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 200 },
  { id: 'w-3', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 200 },
  { id: 'e-4', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 240 },
  { id: 'w-4', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 240 },
  { id: 'e-5', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 280 },
  { id: 'w-5', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 280 },
  { id: 'e-6', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 320 },
  { id: 'w-6', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 320 },
  { id: 'e-7', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 360 },
  { id: 'w-7', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 360 },
  { id: 'e-8', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 400 },
  { id: 'w-8', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 400 },
  { id: 'e-9', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 440 },
  { id: 'w-9', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 440 },
  { id: 'e-10', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 480 },
  { id: 'w-10', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 480 },
  { id: 'e-11', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 520 },
  { id: 'w-11', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 520 },
  { id: 'e-12', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 560 },
  { id: 'w-12', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 560 },
  { id: 'e-13', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 600 },
  { id: 'w-13', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 600 },
  { id: 'e-14', position: { x: 0.5, y: 0 }, direction: 'E', fixedOffsetY: 640 },
  { id: 'w-14', position: { x: 0.5, y: 0 }, direction: 'W', fixedOffsetY: 640 },
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

  // Sequence lifeline shapes use distributed connection points along the lifeline
  if (shapeType === 'sequence-lifeline') {
    return SEQUENCE_LIFELINE_CONNECTION_POINTS;
  }

  // All other shapes use standard rectangle connection points
  return STANDARD_RECTANGLE_CONNECTION_POINTS;
}
