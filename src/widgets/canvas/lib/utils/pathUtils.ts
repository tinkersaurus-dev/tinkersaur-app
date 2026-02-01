/**
 * Utility functions for working with SVG paths and polylines
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates the Euclidean distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the total length of a polyline path
 */
export function calculatePathLength(points: Point[]): number {
  if (points.length < 2) return 0;

  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalLength += distance(points[i], points[i + 1]);
  }

  return totalLength;
}

/**
 * Finds a point at a given percentage (0-1) along a polyline path
 * @param points Array of points that make up the path
 * @param percentage Value between 0 and 1 (0.5 = midpoint)
 * @returns The point at the specified percentage along the path
 */
export function getPointAlongPath(points: Point[], percentage: number): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  if (points.length === 1) {
    return points[0];
  }

  // Clamp percentage to [0, 1]
  percentage = Math.max(0, Math.min(1, percentage));

  const totalLength = calculatePathLength(points);
  const targetDistance = totalLength * percentage;

  let accumulatedDistance = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const segmentStart = points[i];
    const segmentEnd = points[i + 1];
    const segmentLength = distance(segmentStart, segmentEnd);

    if (accumulatedDistance + segmentLength >= targetDistance) {
      // The target point is on this segment
      const remainingDistance = targetDistance - accumulatedDistance;
      const segmentPercentage = segmentLength > 0 ? remainingDistance / segmentLength : 0;

      return {
        x: segmentStart.x + (segmentEnd.x - segmentStart.x) * segmentPercentage,
        y: segmentStart.y + (segmentEnd.y - segmentStart.y) * segmentPercentage,
      };
    }

    accumulatedDistance += segmentLength;
  }

  // If we get here, return the last point
  return points[points.length - 1];
}

/**
 * Calculates the midpoint of a polyline path (50% along the path)
 */
export function getPathMidpoint(points: Point[]): Point {
  return getPointAlongPath(points, 0.5);
}
