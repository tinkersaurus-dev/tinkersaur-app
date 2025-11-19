import type { Point } from '../../utils/pathUtils';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import {
  findOrthogonalRoute,
  type Direction
} from '../../utils/orthogonalRouting';

// Connection point direction for routing
export type ConnectionPointDirection = 'N' | 'S' | 'E' | 'W';

/**
 * Generate path data based on routing style
 * Returns both the SVG path string and the array of points that make up the path
 */
export function getPathData(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startDirection: ConnectionPointDirection,
  endDirection: ConnectionPointDirection,
  style: 'straight' | 'orthogonal' | 'curved',
  options?: {
    /** All shapes for obstacle avoidance (optional) */
    shapes?: Shape[];
    /** Source and target shape IDs to exclude from obstacles */
    excludeShapeIds?: string[];
    /** Use advanced routing algorithm */
    useAdvancedRouting?: boolean;
  }
): { pathData: string; pathPoints: Point[] } {
  switch (style) {
    case 'straight':
      return {
        pathData: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        pathPoints: [start, end],
      };

    case 'curved':
      return getCurvedPath(start, end, startDirection, endDirection);

    case 'orthogonal':
    default:
      // Use advanced routing if shapes are provided and flag is set
      if (options?.useAdvancedRouting && options?.shapes && options.shapes.length > 0) {
        try {
          return getAdvancedOrthogonalPath(
            start,
            end,
            startDirection,
            endDirection,
            options.shapes,
            options.excludeShapeIds || []
          );
        } catch (error) {
          console.error('[pathUtils] Advanced routing FAILED:', error);
          return getOrthogonalPath(start, end, startDirection, endDirection);
        }
      }
      return getOrthogonalPath(start, end, startDirection, endDirection);
  }
}

/**
 * Generate curved (Bezier) path
 * For curved paths, we approximate the path with sample points along the Bezier curve
 */
export function getCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startDirection: ConnectionPointDirection,
  endDirection: ConnectionPointDirection
): { pathData: string; pathPoints: Point[] } {
  const offset = 50; // Control point offset distance

  // Calculate control point based on direction
  const getControlOffset = (
    pos: { x: number; y: number },
    direction: ConnectionPointDirection
  ): { x: number; y: number } => {
    switch (direction) {
      case 'N':
        return { x: pos.x, y: pos.y - offset };
      case 'S':
        return { x: pos.x, y: pos.y + offset };
      case 'E':
        return { x: pos.x + offset, y: pos.y };
      case 'W':
        return { x: pos.x - offset, y: pos.y };
    }
  };

  const c1 = getControlOffset(start, startDirection);
  const c2 = getControlOffset(end, endDirection);

  const pathData = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;

  // Sample points along the Bezier curve for label positioning
  // We use 10 samples to approximate the curve
  const pathPoints: Point[] = [];
  const samples = 10;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    // Cubic Bezier formula: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    pathPoints.push({
      x: mt3 * start.x + 3 * mt2 * t * c1.x + 3 * mt * t2 * c2.x + t3 * end.x,
      y: mt3 * start.y + 3 * mt2 * t * c1.y + 3 * mt * t2 * c2.y + t3 * end.y,
    });
  }

  return { pathData, pathPoints };
}

/**
 * Generate orthogonal (Manhattan) path with right angles
 * Based on the reference implementation from contextstudio
 *
 * This implementation creates cleaner paths by determining routing direction
 * based on the anchor positions (vertical vs horizontal orientation)
 */
export function getOrthogonalPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startDirection: ConnectionPointDirection,
  endDirection: ConnectionPointDirection
): { pathData: string; pathPoints: Point[] } {
  const pathPoints: Point[] = [start];

  // Determine if anchors are vertical (N/S) or horizontal (E/W)
  const isStartVertical = startDirection === 'N' || startDirection === 'S';
  const isEndVertical = endDirection === 'N' || endDirection === 'S';

  if (isStartVertical && isEndVertical) {
    // Both anchors are vertical (N/S): go vertical, then horizontal, then vertical
    const midY = (start.y + end.y) / 2;
    pathPoints.push({ x: start.x, y: midY });
    pathPoints.push({ x: end.x, y: midY });
  } else if (!isStartVertical && !isEndVertical) {
    // Both anchors are horizontal (E/W): go horizontal, then vertical, then horizontal
    const midX = (start.x + end.x) / 2;
    pathPoints.push({ x: midX, y: start.y });
    pathPoints.push({ x: midX, y: end.y });
  } else if (isStartVertical && !isEndVertical) {
    // Start is vertical, end is horizontal: go vertical then horizontal
    pathPoints.push({ x: start.x, y: end.y });
  } else {
    // Start is horizontal, end is vertical: go horizontal then vertical
    pathPoints.push({ x: end.x, y: start.y });
  }

  pathPoints.push(end);

  // Build SVG path string
  const pathData = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return { pathData, pathPoints };
}

/**
 * Infer the connection point direction based on the direction from one point to another
 * This is useful for determining which direction to route from when we only have coordinates
 */
export function inferConnectionDirection(
  from: { x: number; y: number },
  to: { x: number; y: number }
): ConnectionPointDirection {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Determine primary direction based on which axis has greater difference
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal is primary
    return dx > 0 ? 'E' : 'W';
  } else {
    // Vertical is primary
    return dy > 0 ? 'S' : 'N';
  }
}

/**
 * Generate advanced orthogonal path using Wybrow et al. algorithm
 * This uses object-avoiding routing with optimal path finding
 */
export function getAdvancedOrthogonalPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startDirection: ConnectionPointDirection,
  endDirection: ConnectionPointDirection,
  allShapes: Shape[],
  _excludeShapeIds: string[]
): { pathData: string; pathPoints: Point[] } {
  // Instead of excluding shapes entirely, create "connection corridors" around
  // the start and end points to allow routing to reach them while still
  // treating the shapes as obstacles
  const connectionCorridors = [
    {
      x: start.x,
      y: start.y,
      direction: startDirection as Direction
    },
    {
      x: end.x,
      y: end.y,
      direction: endDirection as Direction
    }
  ];

  // Use the Wybrow algorithm to find optimal route
  // Now we pass ALL shapes as obstacles, but with connection corridors
  const pathPoints = findOrthogonalRoute(
    start,
    end,
    allShapes, // Use all shapes, not just filtered ones
    startDirection as Direction,
    endDirection as Direction,
    50, // Bend penalty weight
    true, // Enable path refinement
    true, // Use cache
    connectionCorridors // Pass connection corridors to allow routing to connection points
  );

  // Build SVG path string from points
  const pathData = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return { pathData, pathPoints };
}
