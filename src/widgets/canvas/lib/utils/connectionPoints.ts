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
 * Generates connection points dynamically for sequence diagram lifelines
 * based on the lifeline height. Uses index-based IDs and fixed pixel offsets
 * for stable positioning.
 *
 * @param height - The total height of the lifeline shape
 * @returns Array of connection points for the lifeline
 */
export function generateSequenceLifelineConnectionPoints(height: number): ConnectionPoint[] {
  // Import constants dynamically to avoid circular dependencies
  // These values match the constants in sequenceConstants.ts
  const FIRST_CONNECTION_POINT_Y = 80;
  const CONNECTION_POINT_SPACING = 40;

  const connectionPoints: ConnectionPoint[] = [
    // Top and bottom on participant box (percentage-based)
    { id: 'n', position: { x: 0.5, y: 0 }, direction: 'N' },
    { id: 's', position: { x: 0.5, y: 0.15 }, direction: 'S' },
  ];

  // Generate connection points along the lifeline
  // Start at FIRST_CONNECTION_POINT_Y and add points every CONNECTION_POINT_SPACING
  let index = 0;
  for (let offsetY = FIRST_CONNECTION_POINT_Y; offsetY < height; offsetY += CONNECTION_POINT_SPACING) {
    // Add east connection point
    connectionPoints.push({
      id: `e-${index}`,
      position: { x: 0.5, y: 0 },
      direction: 'E',
      fixedOffsetY: offsetY,
    });

    // Add west connection point
    connectionPoints.push({
      id: `w-${index}`,
      position: { x: 0.5, y: 0 },
      direction: 'W',
      fixedOffsetY: offsetY,
    });

    index++;
  }

  return connectionPoints;
}

/**
 * Gets connection points for a shape based on its type and dimensions.
 * Returns the appropriate connection point configuration for the shape.
 *
 * @param shapeType - The type of the shape
 * @param height - The height of the shape (required for sequence lifelines)
 * @returns Array of connection points for the shape
 */
export function getConnectionPointsForShape(shapeType: string, height?: number): ConnectionPoint[] {
  // Sequence lifeline shapes use dynamically generated connection points
  if (shapeType === 'sequence-lifeline') {
    if (height === undefined) {
      console.warn('Height is required for sequence-lifeline connection points');
      return generateSequenceLifelineConnectionPoints(400); // Fallback to default
    }
    return generateSequenceLifelineConnectionPoints(height);
  }

  // All other shapes use standard rectangle connection points
  return STANDARD_RECTANGLE_CONNECTION_POINTS;
}
