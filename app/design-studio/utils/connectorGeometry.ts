/**
 * Geometry utilities for connector and shape positioning
 */

import type { ConnectionPointDirection } from './connectionPoints';

export type Anchor = 'N' | 'S' | 'E' | 'W';

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Returns the opposite anchor direction
 * Used when creating a shape that should connect from the opposite side
 *
 * @example
 * getOppositeAnchor('N') // Returns 'S'
 * getOppositeAnchor('E') // Returns 'W'
 */
export function getOppositeAnchor(anchor: Anchor): Anchor {
  const opposites: Record<Anchor, Anchor> = {
    N: 'S',
    S: 'N',
    E: 'W',
    W: 'E',
  };
  return opposites[anchor];
}

/**
 * Calculates the center position for a shape such that a specific anchor point
 * will be positioned at the given click/target position
 *
 * @param clickPosition - The target position where the anchor should be placed
 * @param shapeDimensions - The width and height of the shape to be created
 * @param anchor - Which anchor point should align with the click position
 * @returns The center position where the shape should be created
 *
 * @example
 * // If user clicks at (100, 100) and we want the north anchor at that point:
 * calculateShapeCenterForAnchorPosition(
 *   { x: 100, y: 100 },
 *   { width: 120, height: 80 },
 *   'N'
 * )
 * // Returns { x: 100, y: 140 } (center is 40px below the north edge)
 */
export function calculateShapeCenterForAnchorPosition(
  clickPosition: Position,
  shapeDimensions: Dimensions,
  anchor: Anchor
): Position {
  const { x: clickX, y: clickY } = clickPosition;
  const { width, height } = shapeDimensions;

  switch (anchor) {
    case 'N':
      // North anchor is at top center
      // Center should be half height below the click point
      return {
        x: clickX,
        y: clickY + height / 2,
      };

    case 'S':
      // South anchor is at bottom center
      // Center should be half height above the click point
      return {
        x: clickX,
        y: clickY - height / 2,
      };

    case 'E':
      // East anchor is at right center
      // Center should be half width to the left of the click point
      return {
        x: clickX - width / 2,
        y: clickY,
      };

    case 'W':
      // West anchor is at left center
      // Center should be half width to the right of the click point
      return {
        x: clickX + width / 2,
        y: clickY,
      };

    default:
      // Fallback: place center at click position
      return { x: clickX, y: clickY };
  }
}

/**
 * Maps a connection point direction to an anchor
 * Connection points use direction strings, but geometry calculations use anchors
 *
 * @param direction - The connection point direction
 * @returns The corresponding anchor
 */
export function connectionPointDirectionToAnchor(
  direction: ConnectionPointDirection
): Anchor {
  const mapping: Record<ConnectionPointDirection, Anchor> = {
    N: 'N',
    S: 'S',
    E: 'E',
    W: 'W',
  };
  return mapping[direction];
}

/**
 * Gets the default dimensions for a shape type
 * Used when creating shapes from connector dragging
 *
 * @param shapeType - The type of shape being created
 * @returns Default width and height for that shape type
 */
export function getDefaultShapeDimensions(shapeType: string): Dimensions {
  // Standard dimensions for common BPMN and diagram shapes
  const dimensions: Record<string, Dimensions> = {
    // BPMN shapes
    task: { width: 120, height: 80 },
    'start-event': { width: 36, height: 36 },
    'end-event': { width: 36, height: 36 },
    'intermediate-event': { width: 36, height: 36 },
    gateway: { width: 50, height: 50 },

    // Class diagram shapes
    class: { width: 160, height: 120 },
    interface: { width: 160, height: 100 },

    // Sequence diagram shapes
    lifeline: { width: 100, height: 400 },
    actor: { width: 60, height: 100 },

    // Default fallback
    default: { width: 120, height: 80 },
  };

  return dimensions[shapeType] || dimensions.default;
}
