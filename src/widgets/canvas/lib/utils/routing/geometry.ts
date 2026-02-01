/**
 * Geometry utilities for orthogonal connector routing
 */

import type { Shape, Point } from '@/entities/shape';
import type { Direction, ConnectionPoint } from './types';
import { ROUTING_CONSTANTS } from './constants';

/**
 * Direction helper functions
 */
export const DirectionHelpers = {
  /** Rotate direction clockwise (right) */
  right: (d: Direction): Direction => {
    const map: Record<Direction, Direction> = { N: 'E', E: 'S', S: 'W', W: 'N' };
    return map[d];
  },

  /** Rotate direction counter-clockwise (left) */
  left: (d: Direction): Direction => {
    const map: Record<Direction, Direction> = { N: 'W', E: 'N', S: 'E', W: 'S' };
    return map[d];
  },

  /** Get opposite direction */
  reverse: (d: Direction): Direction => {
    const map: Record<Direction, Direction> = { N: 'S', E: 'W', S: 'N', W: 'E' };
    return map[d];
  },

  /** Get directions from v1 to v2 */
  dirns: (v1: Point, v2: Point): Set<Direction> => {
    const dirs = new Set<Direction>();
    if (v2.y > v1.y) dirs.add('N');
    if (v2.x > v1.x) dirs.add('E');
    if (v2.y < v1.y) dirs.add('S');
    if (v2.x < v1.x) dirs.add('W');
    return dirs;
  },

  /** Check if direction is in set */
  hasDirection: (dirs: Set<Direction>, d: Direction): boolean => {
    return dirs.has(d);
  },
};

/**
 * Calculate Manhattan distance between two points
 */
export function manhattanDistance(p1: Point, p2: Point): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

/**
 * Create a unique node ID from coordinates
 * Normalizes to 2 decimal places to handle floating point precision
 */
export function nodeId(x: number, y: number): string {
  const normalizedX =
    Math.round(x * ROUTING_CONSTANTS.NODE_ID_PRECISION) / ROUTING_CONSTANTS.NODE_ID_PRECISION;
  const normalizedY =
    Math.round(y * ROUTING_CONSTANTS.NODE_ID_PRECISION) / ROUTING_CONSTANTS.NODE_ID_PRECISION;
  return `${normalizedX},${normalizedY}`;
}

/**
 * Check if a horizontal line segment intersects with a shape
 * Optionally excludes "corridors" around connection points to allow routing to them
 */
export function horizontalSegmentIntersectsShape(
  x1: number,
  x2: number,
  y: number,
  shape: Shape,
  _connectionCorridors?: ConnectionPoint[]
): boolean {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);

  // Check if segment passes through or touches the shape
  // Use strict inequalities to block paths that touch shape boundaries
  const intersects = !(
    maxX < shape.x ||
    minX > shape.x + shape.width ||
    y < shape.y ||
    y > shape.y + shape.height
  );

  return intersects;
}

/**
 * Check if a vertical line segment intersects with a shape
 */
export function verticalSegmentIntersectsShape(
  x: number,
  y1: number,
  y2: number,
  shape: Shape,
  _connectionCorridors?: ConnectionPoint[]
): boolean {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  // Check if segment passes through or touches the shape
  // Use strict inequalities to block paths that touch shape boundaries
  const intersects = !(
    x < shape.x ||
    x > shape.x + shape.width ||
    maxY < shape.y ||
    minY > shape.y + shape.height
  );

  return intersects;
}
