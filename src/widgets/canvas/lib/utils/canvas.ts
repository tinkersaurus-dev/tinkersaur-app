/**
 * Canvas Utility Functions
 *
 * Helper functions for canvas coordinate transformations,
 * zoom constraints, and other canvas-related calculations.
 */

import { getConnectionPointsForShape } from './connectionPoints';
import { findOrthogonalRoute, type Direction } from './routing';
import type { Shape } from '@/entities/shape';
import { CANVAS_CONFIG } from '../config/design-studio-config';

/**
 * Snap a coordinate to the nearest grid point
 *
 * @param value - The coordinate value to snap
 * @param gridSize - The grid size to snap to (default: 10)
 * @returns The snapped coordinate value
 */
export function snapToGrid(value: number, gridSize: number = 10): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Convert screen coordinates to canvas coordinates
 *
 * Takes mouse/pointer coordinates in screen space and converts them
 * to canvas space, accounting for zoom and pan transformations.
 *
 * @param screenX - X coordinate in screen space (pixels)
 * @param screenY - Y coordinate in screen space (pixels)
 * @param zoom - Current zoom level (1 = 100%)
 * @param panX - Current pan offset X
 * @param panY - Current pan offset Y
 * @returns Canvas coordinates { x, y }
 *
 * @example
 * ```ts
 * const { x, y } = screenToCanvas(event.clientX, event.clientY, 2, 100, 50);
 * // If mouse is at screen (300, 200) with 2x zoom and pan (100, 50):
 * // Canvas position = ((300 - 100) / 2, (200 - 50) / 2) = (100, 75)
 * ```
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  zoom: number,
  panX: number,
  panY: number
): { x: number; y: number } {
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  };
}

/**
 * Convert canvas coordinates to screen coordinates
 *
 * Takes coordinates in canvas space and converts them to screen space,
 * accounting for zoom and pan transformations.
 *
 * @param canvasX - X coordinate in canvas space
 * @param canvasY - Y coordinate in canvas space
 * @param zoom - Current zoom level (1 = 100%)
 * @param panX - Current pan offset X
 * @param panY - Current pan offset Y
 * @returns Screen coordinates { x, y }
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  zoom: number,
  panX: number,
  panY: number
): { x: number; y: number } {
  return {
    x: canvasX * zoom + panX,
    y: canvasY * zoom + panY,
  };
}

/**
 * Constrain zoom level to valid range
 *
 * Ensures zoom stays between 0.1x (10%) and 5x (500%).
 *
 * @param zoom - Desired zoom level
 * @returns Constrained zoom level
 */
export function constrainZoom(zoom: number): number {
  return Math.max(0.1, Math.min(5, zoom));
}

/**
 * Calculate new zoom level from wheel delta
 *
 * Converts mouse wheel delta to a smooth zoom change.
 * Negative delta = zoom in, positive delta = zoom out.
 *
 * @param currentZoom - Current zoom level
 * @param deltaY - Wheel event deltaY value
 * @param sensitivity - Zoom sensitivity multiplier (default: 0.001)
 * @returns New constrained zoom level
 */
export function calculateZoomFromWheel(
  currentZoom: number,
  deltaY: number,
  sensitivity: number = 0.001
): number {
  const zoomDelta = 1 + deltaY * -sensitivity;
  const newZoom = currentZoom * zoomDelta;
  return constrainZoom(newZoom);
}

/**
 * Calculate zoom to point (cursor position)
 *
 * When zooming, adjust pan so that the cursor position stays fixed.
 * This creates a "zoom to cursor" effect.
 *
 * @param cursorX - Cursor X in screen space
 * @param cursorY - Cursor Y in screen space
 * @param oldZoom - Previous zoom level
 * @param newZoom - New zoom level
 * @param oldPanX - Previous pan X
 * @param oldPanY - Previous pan Y
 * @returns New pan offsets { panX, panY }
 *
 * @example
 * ```ts
 * // User scrolls at cursor position (400, 300)
 * // Zoom changes from 1x to 1.2x
 * const { panX, panY } = calculateZoomToPoint(400, 300, 1, 1.2, 0, 0);
 * // Returns adjusted pan so point under cursor stays fixed
 * ```
 */
export function calculateZoomToPoint(
  cursorX: number,
  cursorY: number,
  oldZoom: number,
  newZoom: number,
  oldPanX: number,
  oldPanY: number
): { panX: number; panY: number } {
  // Calculate canvas point under cursor before zoom
  const canvasX = (cursorX - oldPanX) / oldZoom;
  const canvasY = (cursorY - oldPanY) / oldZoom;

  // Calculate new pan to keep that canvas point under cursor after zoom
  const newPanX = cursorX - canvasX * newZoom;
  const newPanY = cursorY - canvasY * newZoom;

  return {
    panX: newPanX,
    panY: newPanY,
  };
}

/**
 * Calculate bounding box for multiple points
 *
 * @param points - Array of points
 * @returns Bounding box { minX, minY, maxX, maxY, width, height }
 */
export function calculateBoundingBox(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxX = Math.max(...points.map((p) => p.x));
  const maxY = Math.max(...points.map((p) => p.y));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Normalize rectangle coordinates
 *
 * Takes rectangle defined by two points (e.g., drag start/end) and returns
 * normalized left/right/top/bottom coordinates, handling drag in any direction.
 *
 * @param startX - Rectangle start X coordinate
 * @param startY - Rectangle start Y coordinate
 * @param endX - Rectangle end X coordinate
 * @param endY - Rectangle end Y coordinate
 * @returns Normalized rectangle { left, right, top, bottom }
 *
 * @example
 * ```ts
 * // User drags from (100, 100) to (50, 150)
 * const rect = normalizeRectangle(100, 100, 50, 150);
 * // Returns { left: 50, right: 100, top: 100, bottom: 150 }
 * ```
 */
export function normalizeRectangle(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { left: number; right: number; top: number; bottom: number } {
  return {
    left: Math.min(startX, endX),
    right: Math.max(startX, endX),
    top: Math.min(startY, endY),
    bottom: Math.max(startY, endY),
  };
}

/**
 * Get bounding box coordinates for a shape
 *
 * Extracts left, right, top, bottom coordinates from a shape object.
 *
 * @param shape - Shape with x, y, width, height properties
 * @returns Shape bounds { left, right, top, bottom }
 *
 * @example
 * ```ts
 * const shape = { x: 100, y: 50, width: 200, height: 150 };
 * const bounds = getShapeBounds(shape);
 * // Returns { left: 100, right: 300, top: 50, bottom: 200 }
 * ```
 */
export function getShapeBounds(shape: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { left: number; right: number; top: number; bottom: number } {
  return {
    left: shape.x,
    right: shape.x + shape.width,
    top: shape.y,
    bottom: shape.y + shape.height,
  };
}

/**
 * Test if two axis-aligned bounding boxes (AABBs) intersect
 *
 * Uses the separating axis theorem for AABBs. Two rectangles intersect
 * if they overlap on both the X and Y axes.
 *
 * @param rect1 - First rectangle { left, right, top, bottom }
 * @param rect2 - Second rectangle { left, right, top, bottom }
 * @returns true if rectangles intersect, false otherwise
 *
 * @example
 * ```ts
 * const box1 = { left: 0, right: 100, top: 0, bottom: 100 };
 * const box2 = { left: 50, right: 150, top: 50, bottom: 150 };
 * rectanglesIntersect(box1, box2); // true - they overlap
 *
 * const box3 = { left: 200, right: 300, top: 200, bottom: 300 };
 * rectanglesIntersect(box1, box3); // false - separated
 * ```
 */
export function rectanglesIntersect(
  rect1: { left: number; right: number; top: number; bottom: number },
  rect2: { left: number; right: number; top: number; bottom: number }
): boolean {
  // Rectangles DON'T intersect if one is completely outside the other
  // Negate this to get intersection test
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

/**
 * Calculate Euclidean distance between two points
 *
 * Uses the Pythagorean theorem to compute the straight-line distance
 * between two points in 2D space.
 *
 * @param point1 - First point { x, y }
 * @param point2 - Second point { x, y }
 * @returns Distance between points
 *
 * @example
 * ```ts
 * const p1 = { x: 0, y: 0 };
 * const p2 = { x: 3, y: 4 };
 * distance(p1, p2); // 5 (3-4-5 triangle)
 * ```
 */
export function distance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get bounding box for a connector
 *
 * Calculates the bounding rectangle that encompasses the entire connector path.
 * This is used for selection box intersection testing.
 *
 * @param connector - The connector object
 * @param sourceShape - The source shape the connector originates from
 * @param targetShape - The target shape the connector connects to
 * @returns Connector bounds { left, right, top, bottom }
 *
 * @example
 * ```ts
 * const connector = { style: 'orthogonal', ... };
 * const bounds = getConnectorBounds(connector, sourceShape, targetShape);
 * // Returns bounding box that encompasses the entire connector path
 * ```
 */
export function getConnectorBounds(
  connector: {
    style: 'straight' | 'orthogonal' | 'curved';
    sourceConnectionPoint?: string;
    targetConnectionPoint?: string;
  },
  sourceShape: { x: number; y: number; width: number; height: number; type: string },
  targetShape: { x: number; y: number; width: number; height: number; type: string }
): { left: number; right: number; top: number; bottom: number } {
  // Get connection points from shapes
  const sourceConnectionPoints = getConnectionPointsForShape(sourceShape.type, sourceShape.height);
  const targetConnectionPoints = getConnectionPointsForShape(targetShape.type, targetShape.height);

  // Calculate connection points (same logic as LineConnectorRenderer)
  // Note: For bounding box calculation, we use simple distance-based selection
  // to avoid performance overhead
  const { start, end } = findOptimalConnectionPoints(
    sourceConnectionPoints,
    targetConnectionPoints,
    sourceShape,
    targetShape,
    { useSmartSelection: false }
  );

  // For straight and curved connectors, we can use a simple bounding box
  // For orthogonal, we need to account for the path segments
  if (connector.style === 'straight' || connector.style === 'curved') {
    return {
      left: Math.min(start.x, end.x),
      right: Math.max(start.x, end.x),
      top: Math.min(start.y, end.y),
      bottom: Math.max(start.y, end.y),
    };
  }

  // For orthogonal routing, calculate the path points and get their bounds
  const pathPoints = getOrthogonalPathPoints(start, end);
  const bounds = calculateBoundingBox(pathPoints);

  return {
    left: bounds.minX,
    right: bounds.maxX,
    top: bounds.minY,
    bottom: bounds.maxY,
  };
}

/**
 * Score a route based on quality metrics
 *
 * Evaluates a route based on two simple factors:
 * 1. Euclidean distance between connection points (closer is better)
 * 2. Whether a valid path exists (no obstacles blocking)
 *
 * @param pathPoints - The points that make up the route
 * @param start - Starting point
 * @param end - Ending point
 * @returns A score where higher is better (0-1 range, normalized)
 */
function scoreRoute(
  pathPoints: Array<{ x: number; y: number }>,
  start: { x: number; y: number },
  end: { x: number; y: number }
): number {
  // If no path was found, this route is invalid
  if (pathPoints.length === 0) {
    return 0;
  }

  // If route is just a straight line [start, end], check if it's a valid orthogonal path or a failed diagonal
  if (pathPoints.length === 2 &&
      pathPoints[0].x === start.x && pathPoints[0].y === start.y &&
      pathPoints[1].x === end.x && pathPoints[1].y === end.y) {
    // Check if it's orthogonal (same X or same Y)
    const isOrthogonal = (start.x === end.x) || (start.y === end.y);
    if (!isOrthogonal) {
      // Diagonal line = routing failed
      return 0;
    }
    // Otherwise it's a valid straight orthogonal path, continue to score it normally
  }

  // Calculate Euclidean (straight-line) distance between connection points
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const euclideanDistance = Math.sqrt(dx * dx + dy * dy);

  // Avoid division by zero for overlapping points
  if (euclideanDistance === 0) {
    return 1;
  }

  // Score based purely on distance (closer is better)
  // Normalize by dividing by 1000 to get reasonable scale
  // Then use exponential decay to map to 0-1 range
  const distancePenalty = euclideanDistance / 1000;
  const score = Math.exp(-distancePenalty);

  return score;
}

/**
 * Find the optimal pair of connection points between two shapes
 *
 * This evaluates all possible connection point pairs and selects the one
 * that produces the best route quality, considering obstacles and path complexity.
 * When shapes are not provided, falls back to simple Euclidean distance.
 *
 * @param sourceConnectionPoints - Available connection points on the source shape
 * @param targetConnectionPoints - Available connection points on the target shape
 * @param sourceBounds - The source shape bounds
 * @param targetBounds - The target shape bounds
 * @param options - Optional configuration for smart routing
 * @returns Object containing optimal connection point IDs, directions, and start/end positions
 */
export function findOptimalConnectionPoints(
  sourceConnectionPoints: Array<{
    id: string;
    position: { x: number; y: number };
    direction: 'N' | 'S' | 'E' | 'W';
  }>,
  targetConnectionPoints: Array<{
    id: string;
    position: { x: number; y: number };
    direction: 'N' | 'S' | 'E' | 'W';
  }>,
  sourceBounds: { x: number; y: number; width: number; height: number },
  targetBounds: { x: number; y: number; width: number; height: number },
  options?: {
    /** All shapes for obstacle-aware routing */
    shapes?: Shape[];
    /** Shape IDs to exclude from obstacle detection (typically source and target) */
    excludeShapeIds?: string[];
    /** Enable smart connection point selection based on routing quality */
    useSmartSelection?: boolean;
  }
): {
  sourceConnectionPointId: string;
  targetConnectionPointId: string;
  sourceDirection: 'N' | 'S' | 'E' | 'W';
  targetDirection: 'N' | 'S' | 'E' | 'W';
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  // Check if smart selection is enabled and we have shapes to consider
  const useSmartSelection =
    options?.useSmartSelection !== false && // Default to true unless explicitly disabled
    options?.shapes &&
    options.shapes.length > 2; // Need at least one obstacle shape

  if (!useSmartSelection) {
    // Fall back to simple Euclidean distance selection
    return findOptimalConnectionPointsByDistance(
      sourceConnectionPoints,
      targetConnectionPoints,
      sourceBounds,
      targetBounds
    );
  }

  // Smart selection: evaluate route quality for each connection point pair
  let bestScore = -Infinity;
  let bestSourcePoint = sourceConnectionPoints[0];
  let bestTargetPoint = targetConnectionPoints[0];
  let bestStart = { x: 0, y: 0 };
  let bestEnd = { x: 0, y: 0 };

  // Filter out excluded shapes (source and target)
  const obstacleShapes = options.shapes!.filter(
    shape => !options.excludeShapeIds?.includes(shape.id)
  );

  // Pre-filter connection point pairs based on relative position
  // This reduces the number of trial routes we need to calculate
  const pairsToTest = prefilterConnectionPointPairs(
    sourceConnectionPoints,
    targetConnectionPoints,
    sourceBounds,
    targetBounds
  );

  // Limit the number of pairs we test for performance
  const maxPairsToTest = CANVAS_CONFIG.routing.maxConnectionPointTrials || 16;
  const limitedPairs = pairsToTest.slice(0, maxPairsToTest);
  

  // Build ALL connection points for visibility extensions (not just the pair being tested)
  const allConnectionPoints: Array<{ x: number; y: number; direction: Direction }> = [];

  // Add all source connection points
  for (const point of sourceConnectionPoints) {
    allConnectionPoints.push({
      x: sourceBounds.x + point.position.x * sourceBounds.width,
      y: sourceBounds.y + point.position.y * sourceBounds.height,
      direction: point.direction as Direction
    });
  }

  // Add all target connection points
  for (const point of targetConnectionPoints) {
    allConnectionPoints.push({
      x: targetBounds.x + point.position.x * targetBounds.width,
      y: targetBounds.y + point.position.y * targetBounds.height,
      direction: point.direction as Direction
    });
  }


  for (const { sourcePoint, targetPoint } of limitedPairs) {
    
  
    
    const sourcePos = {
      x: sourceBounds.x + sourcePoint.position.x * sourceBounds.width,
      y: sourceBounds.y + sourcePoint.position.y * sourceBounds.height,
    };

    const targetPos = {
      x: targetBounds.x + targetPoint.position.x * targetBounds.width,
      y: targetBounds.y + targetPoint.position.y * targetBounds.height,
    };

    try {
      // Calculate trial route using orthogonal routing algorithm
      // Pass ALL connection points so visibility extensions can be created from all of them
      const pathPoints = findOrthogonalRoute(
        sourcePos,
        targetPos,
        obstacleShapes,
        sourcePoint.direction as Direction,
        targetPoint.direction as Direction,
        allConnectionPoints
      );



      // Skip pairs where routing completely failed (no path found)
      if (pathPoints.length === 0) {

        continue;
      }

      // Score this route
      const score = scoreRoute(pathPoints, sourcePos, targetPos);

      // Update best if this is better
      if (score > bestScore) {
        bestScore = score;
        bestSourcePoint = sourcePoint;
        bestTargetPoint = targetPoint;
        bestStart = sourcePos;
        bestEnd = targetPos;
      }

      // Early termination: if we found a near-perfect route, use it
      if (score > 0.95) {
        break;
      }
    } catch (error) {
      // If routing fails for this pair, skip it
      console.warn('Route calculation failed for connection point pair:', error);
      continue;
    }
  }

  // If no valid route was found after trying all pairs, fall back to simple distance-based selection
  // This ensures we always return a connection, even if routing fails
  if (bestScore === -Infinity) {
    console.warn('All route attempts failed, falling back to distance-based selection');
    return findOptimalConnectionPointsByDistance(
      sourceConnectionPoints,
      targetConnectionPoints,
      sourceBounds,
      targetBounds
    );
  }

  return {
    sourceConnectionPointId: bestSourcePoint.id,
    targetConnectionPointId: bestTargetPoint.id,
    sourceDirection: bestSourcePoint.direction,
    targetDirection: bestTargetPoint.direction,
    start: bestStart,
    end: bestEnd,
  };
}

/**
 * Find optimal connection points using simple Euclidean distance
 * (Legacy algorithm, used as fallback)
 */
function findOptimalConnectionPointsByDistance(
  sourceConnectionPoints: Array<{
    id: string;
    position: { x: number; y: number };
    direction: 'N' | 'S' | 'E' | 'W';
  }>,
  targetConnectionPoints: Array<{
    id: string;
    position: { x: number; y: number };
    direction: 'N' | 'S' | 'E' | 'W';
  }>,
  sourceBounds: { x: number; y: number; width: number; height: number },
  targetBounds: { x: number; y: number; width: number; height: number }
): {
  sourceConnectionPointId: string;
  targetConnectionPointId: string;
  sourceDirection: 'N' | 'S' | 'E' | 'W';
  targetDirection: 'N' | 'S' | 'E' | 'W';
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  let minDistance = Infinity;
  let bestSourcePoint = sourceConnectionPoints[0];
  let bestTargetPoint = targetConnectionPoints[0];
  let bestStart = { x: 0, y: 0 };
  let bestEnd = { x: 0, y: 0 };

  for (const sourcePoint of sourceConnectionPoints) {
    const sourcePos = {
      x: sourceBounds.x + sourcePoint.position.x * sourceBounds.width,
      y: sourceBounds.y + sourcePoint.position.y * sourceBounds.height,
    };

    for (const targetPoint of targetConnectionPoints) {
      const targetPos = {
        x: targetBounds.x + targetPoint.position.x * targetBounds.width,
        y: targetBounds.y + targetPoint.position.y * targetBounds.height,
      };

      const dist = Math.hypot(targetPos.x - sourcePos.x, targetPos.y - sourcePos.y);

      if (dist < minDistance) {
        minDistance = dist;
        bestSourcePoint = sourcePoint;
        bestTargetPoint = targetPoint;
        bestStart = sourcePos;
        bestEnd = targetPos;
      }
    }
  }

  return {
    sourceConnectionPointId: bestSourcePoint.id,
    targetConnectionPointId: bestTargetPoint.id,
    sourceDirection: bestSourcePoint.direction,
    targetDirection: bestTargetPoint.direction,
    start: bestStart,
    end: bestEnd,
  };
}

/**
 * Pre-filter connection point pairs based on distance
 * Sorts pairs by Euclidean distance (shortest first)
 * The routing algorithm will try the shortest distance pair first, then move to the next shortest if that fails
 */
function prefilterConnectionPointPairs(
  sourceConnectionPoints: Array<{
    id: string;
    position: { x: number; y: number };
    direction: 'N' | 'S' | 'E' | 'W';
  }>,
  targetConnectionPoints: Array<{
    id: string;
    position: { x: number; y: number };
    direction: 'N' | 'S' | 'E' | 'W';
  }>,
  sourceBounds: { x: number; y: number; width: number; height: number },
  targetBounds: { x: number; y: number; width: number; height: number }
): Array<{
  sourcePoint: { id: string; position: { x: number; y: number }; direction: 'N' | 'S' | 'E' | 'W' };
  targetPoint: { id: string; position: { x: number; y: number }; direction: 'N' | 'S' | 'E' | 'W' };
  score: number;
}> {
  const pairs: Array<{
    sourcePoint: { id: string; position: { x: number; y: number }; direction: 'N' | 'S' | 'E' | 'W' };
    targetPoint: { id: string; position: { x: number; y: number }; direction: 'N' | 'S' | 'E' | 'W' };
    score: number;
  }> = [];

  for (const sourcePoint of sourceConnectionPoints) {
    for (const targetPoint of targetConnectionPoints) {
      // Calculate actual Euclidean distance between the connection points
      const sourcePos = {
        x: sourceBounds.x + sourcePoint.position.x * sourceBounds.width,
        y: sourceBounds.y + sourcePoint.position.y * sourceBounds.height,
      };
      const targetPos = {
        x: targetBounds.x + targetPoint.position.x * targetBounds.width,
        y: targetBounds.y + targetPoint.position.y * targetBounds.height,
      };
      const dist = Math.hypot(targetPos.x - sourcePos.x, targetPos.y - sourcePos.y);

      pairs.push({
        sourcePoint,
        targetPoint,
        score: -dist // Negative so that sorting by highest score gives us shortest distance first
      });
    }
  }

  // Sort by score (highest first) = shortest distance first
  return pairs.sort((a, b) => b.score - a.score);
}


/**
 * Get orthogonal path points for bounding box calculation
 */
function getOrthogonalPathPoints(
  start: { x: number; y: number },
  end: { x: number; y: number }
): Array<{ x: number; y: number }> {
  const path: Array<{ x: number; y: number }> = [start];

  // Simple orthogonal routing: go horizontal then vertical, or vice versa
  // This is a simplified version - just need the bounding points
  const midX = (start.x + end.x) / 2;

  // Add intermediate points that would be in an orthogonal path
  path.push({ x: midX, y: start.y });
  path.push({ x: midX, y: end.y });
  path.push(end);

  return path;
}
