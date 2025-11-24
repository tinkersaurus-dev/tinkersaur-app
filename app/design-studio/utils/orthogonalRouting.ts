/**
 * Orthogonal Connector Routing Algorithm
 * Based on Wybrow, Marriott, and Stuckey (2009)
 * "Orthogonal Connector Routing" - Graph Drawing 2009
 *
 * This module implements optimal object-avoiding orthogonal connector routing
 * using a three-stage approach:
 * 1. Construct orthogonal visibility graph with offset corner points and
 *    proper visibility extensions from connection points
 * 2. Find optimal route using A* search
 * 3. Simplify route by removing collinear segments
 */

import type { Shape, Point } from "~/core/entities/design-studio/types/Shape";
import { DESIGN_STUDIO_CONFIG } from "~/design-studio/config/design-studio-config";

// Cardinal directions for routing
export type Direction = 'N' | 'S' | 'E' | 'W';

// Node in the orthogonal visibility graph
export interface VisibilityNode {
  x: number;
  y: number;
  id: string; // Unique identifier: "x,y"
}

// Edge in the orthogonal visibility graph
export interface VisibilityEdge {
  from: string; // node id
  to: string; // node id
  direction: Direction;
  length: number;
}

// Orthogonal visibility graph
export interface OrthogonalVisibilityGraph {
  nodes: Map<string, VisibilityNode>;
  edges: Map<string, VisibilityEdge[]>; // Adjacency list: nodeId -> edges
}

// Route segment with direction information
export interface RouteSegment {
  from: Point;
  to: Point;
  direction: Direction;
}

// A* search state
interface SearchState {
  nodeId: string;
  entryDirection: Direction;
  pathLength: number;
  bendCount: number;
  cost: number;
  parent: SearchState | null;
}

/**
 * Direction helper functions
 */
export const DirectionHelpers = {
  right: (d: Direction): Direction => {
    const map: Record<Direction, Direction> = { N: 'E', E: 'S', S: 'W', W: 'N' };
    return map[d];
  },

  left: (d: Direction): Direction => {
    const map: Record<Direction, Direction> = { N: 'W', E: 'N', S: 'E', W: 'S' };
    return map[d];
  },

  reverse: (d: Direction): Direction => {
    const map: Record<Direction, Direction> = { N: 'S', E: 'W', S: 'N', W: 'E' };
    return map[d];
  },

  // Get directions from v1 to v2
  dirns: (v1: Point, v2: Point): Set<Direction> => {
    const dirs = new Set<Direction>();
    if (v2.y > v1.y) dirs.add('N');
    if (v2.x > v1.x) dirs.add('E');
    if (v2.y < v1.y) dirs.add('S');
    if (v2.x < v1.x) dirs.add('W');
    return dirs;
  },

  // Check if direction is in set
  hasDirection: (dirs: Set<Direction>, d: Direction): boolean => {
    return dirs.has(d);
  }
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
function nodeId(x: number, y: number): string {
  const normalizedX = Math.round(x * 100) / 100;
  const normalizedY = Math.round(y * 100) / 100;
  return `${normalizedX},${normalizedY}`;
}

/**
 * Check if a horizontal line segment intersects with a shape
 * Optionally excludes "corridors" around connection points to allow routing to them
 */
function horizontalSegmentIntersectsShape(
  x1: number,
  x2: number,
  y: number,
  shape: Shape,
  _connectionCorridors?: Array<{ x: number; y: number; direction: Direction }>
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
function verticalSegmentIntersectsShape(
  x: number,
  y1: number,
  y2: number,
  shape: Shape,
  _connectionCorridors?: Array<{ x: number; y: number; direction: Direction }>
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

/**
 * Get all interesting points from shapes
 *
 * Instead of using exact shape corners, we generate points offset by the nudge distance.
 * This creates routing paths that naturally maintain spacing from shapes, eliminating
 * the need for post-processing nudging.
 *
 * For each shape, we create routing points at the four corners of an expanded bounding box.
 * Visibility extensions from connection points handle routing along the sides of shapes.
 *
 * IMPORTANT: Only shapes with connection points get corner nodes.
 * Obstacle shapes (without connection points) do NOT participate in routing lanes.
 */
function getShapeCornerPointsWithOffset(
  shapes: Shape[],
  connectionPoints?: Array<{ x: number; y: number; direction: Direction }>
): Point[] {
  const points: Point[] = [];
  const NUDGE = DESIGN_STUDIO_CONFIG.routing.nudgeDistance;

  // If no connection points provided, don't create any corner points
  if (!connectionPoints || connectionPoints.length === 0) {
    return points;
  }

  // Identify which shapes have connection points (source/target shapes)
  const shapesWithConnections = new Set<Shape>();
  for (const cp of connectionPoints) {
    for (const shape of shapes) {
      // Check if connection point is on this shape's boundary
      const onTop = Math.abs(cp.y - shape.y) < 1 && cp.x >= shape.x && cp.x <= shape.x + shape.width;
      const onBottom = Math.abs(cp.y - (shape.y + shape.height)) < 1 && cp.x >= shape.x && cp.x <= shape.x + shape.width;
      const onLeft = Math.abs(cp.x - shape.x) < 1 && cp.y >= shape.y && cp.y <= shape.y + shape.height;
      const onRight = Math.abs(cp.x - (shape.x + shape.width)) < 1 && cp.y >= shape.y && cp.y <= shape.y + shape.height;

      if (onTop || onBottom || onLeft || onRight) {
        shapesWithConnections.add(shape);
      }
    }
  }


  // Only create corner points for shapes that have connection points
  for (const shape of shapesWithConnections) {
    // Create offset bounding box corners only
    // These are positioned at nudgeDistance away from the actual shape boundaries

    // Top-left corner (NW)
    points.push({ x: shape.x - NUDGE, y: shape.y - NUDGE });

    // Top-right corner (NE)
    points.push({ x: shape.x + shape.width + NUDGE, y: shape.y - NUDGE });

    // Bottom-left corner (SW)
    points.push({ x: shape.x - NUDGE, y: shape.y + shape.height + NUDGE });

    // Bottom-right corner (SE)
    points.push({ x: shape.x + shape.width + NUDGE, y: shape.y + shape.height + NUDGE });
  }

  return points;
}

/**
 * Generate all interesting horizontal segments
 * (segments between interesting points with no intervening objects)
 */
function generateHorizontalSegments(
  shapeCornerPointsWithOffset: Point[],
  shapes: Shape[],
  connectionCorridors?: Array<{ x: number; y: number; direction: Direction }>
): Array<{ from: Point; to: Point }> {
  const segments: Array<{ from: Point; to: Point }> = [];

  // Group points by y coordinate
  const pointsByY = new Map<number, Point[]>();
  for (const point of shapeCornerPointsWithOffset) {
    if (!pointsByY.has(point.y)) {
      pointsByY.set(point.y, []);
    }
    pointsByY.get(point.y)!.push(point);
  }

  // For each horizontal line, find segments
  for (const [y, points] of pointsByY) {
    // Sort points by x coordinate
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);

    // Generate segments between consecutive points
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i + 1];

      // Check if segment is blocked by any shape
      let blocked = false;
      for (const shape of shapes) {
        if (horizontalSegmentIntersectsShape(p1.x, p2.x, y, shape, connectionCorridors)) {
          blocked = true;
          break;
        }
      }

      if (!blocked) {
        segments.push({ from: p1, to: p2 });
      }
    }
  }

  return segments;
}

/**
 * Generate all interesting vertical segments
 * (segments between interesting points with no intervening objects)
 */
function generateVerticalSegments(
  interestingPoints: Point[],
  shapes: Shape[],
  connectionCorridors?: Array<{ x: number; y: number; direction: Direction }>
): Array<{ from: Point; to: Point }> {
  const segments: Array<{ from: Point; to: Point }> = [];

  // Group points by x coordinate
  const pointsByX = new Map<number, Point[]>();
  for (const point of interestingPoints) {
    if (!pointsByX.has(point.x)) {
      pointsByX.set(point.x, []);
    }
    pointsByX.get(point.x)!.push(point);
  }

  // For each vertical line, find segments
  for (const [x, points] of pointsByX) {
    // Sort points by y coordinate
    const sortedPoints = [...points].sort((a, b) => a.y - b.y);

    // Generate segments between consecutive points
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i + 1];

      // Check if segment is blocked by any shape
      let blocked = false;
      for (const shape of shapes) {
        if (verticalSegmentIntersectsShape(x, p1.y, p2.y, shape, connectionCorridors)) {
          blocked = true;
          break;
        }
      }

      if (!blocked) {
        segments.push({ from: p1, to: p2 });
      }
    }
  }

  return segments;
}

/**
 * Extend visibility from a connection point in its port direction
 * Creates nodes at intersections with existing visibility lines and shape boundaries
 */
function extendVisibilityFromConnectionPoint(
  connectionPoint: { x: number; y: number; direction: Direction },
  shapes: Shape[],
  horizontalSegments: Array<{ from: Point; to: Point }>,
  verticalSegments: Array<{ from: Point; to: Point }>,
  nodes: Map<string, VisibilityNode>,
  edges: Map<string, VisibilityEdge[]>,
  bboxBounds?: { minX: number; minY: number; maxX: number; maxY: number }
): void {
  const { x, y, direction } = connectionPoint;

  // Add the connection point itself as a node
  const connectionPointId = nodeId(x, y);
  if (!nodes.has(connectionPointId)) {
    nodes.set(connectionPointId, { x, y, id: connectionPointId });
    edges.set(connectionPointId, []);
  }

  // Find the maximum extension distance in the port direction before hitting a shape
  let maxExtension = Infinity;

  for (const shape of shapes) {
    switch (direction) {
      case 'N': // Extending upward (decreasing y)
        if (x >= shape.x && x <= shape.x + shape.width) {
          // Ray passes through shape's x range
          const shapeBottom = shape.y + shape.height;
          if (shapeBottom < y) {
            // Shape is above us
            maxExtension = Math.min(maxExtension, y - shapeBottom);
          }
        }
        break;
      case 'S': // Extending downward (increasing y)
        if (x >= shape.x && x <= shape.x + shape.width) {
          const shapeTop = shape.y;
          if (shapeTop > y) {
            // Shape is below us
            maxExtension = Math.min(maxExtension, shapeTop - y);
          }
        }
        break;
      case 'E': // Extending right (increasing x)
        if (y >= shape.y && y <= shape.y + shape.height) {
          const shapeLeft = shape.x;
          if (shapeLeft > x) {
            // Shape is to the right
            maxExtension = Math.min(maxExtension, shapeLeft - x);
          }
        }
        break;
      case 'W': // Extending left (decreasing x)
        if (y >= shape.y && y <= shape.y + shape.height) {
          const shapeRight = shape.x + shape.width;
          if (shapeRight < x) {
            // Shape is to the left
            maxExtension = Math.min(maxExtension, x - shapeRight);
          }
        }
        break;
    }
  }

  // Use a reasonable default extension distance if no obstacle is found
  const DEFAULT_EXTENSION = DESIGN_STUDIO_CONFIG.routing.maxGraphConnectionDistance;
  if (maxExtension === Infinity) {
    maxExtension = DEFAULT_EXTENSION;
  }

  // Find all intersections with existing visibility segments AND existing nodes
  const intersections: Array<{ x: number; y: number; distance: number }> = [];

  if (direction === 'N' || direction === 'S') {
    // Vertical extension - find intersections with horizontal segments
    for (const seg of horizontalSegments) {
      if (seg.from.y === seg.to.y) { // Confirm it's horizontal
        const segY = seg.from.y;
        const segMinX = Math.min(seg.from.x, seg.to.x);
        const segMaxX = Math.max(seg.from.x, seg.to.x);

        // Check if our ray intersects this horizontal segment
        if (x >= segMinX && x <= segMaxX) {
          const distance = Math.abs(segY - y);
          if (distance > 0 && distance <= maxExtension) {
            // Check direction
            if ((direction === 'N' && segY < y) || (direction === 'S' && segY > y)) {
              intersections.push({ x, y: segY, distance });
            }
          }
        }
      }
    }

    // Also find nodes that lie on the same vertical line
    for (const [_nodeIdStr, node] of nodes) {
      if (node.x === x) {
        const distance = Math.abs(node.y - y);
        if (distance > 0 && distance <= maxExtension) {
          if ((direction === 'N' && node.y < y) || (direction === 'S' && node.y > y)) {
            intersections.push({ x: node.x, y: node.y, distance });
          }
        }
      }
    }

    // Check for intersection with bounding box edges
    if (bboxBounds) {
      if (direction === 'N' && bboxBounds.minY < y) {
        // Ray going north might hit top edge of bbox
        const distance = y - bboxBounds.minY;
        if (distance > 0 && distance <= maxExtension) {
          intersections.push({ x, y: bboxBounds.minY, distance });
        }
      } else if (direction === 'S' && bboxBounds.maxY > y) {
        // Ray going south might hit bottom edge of bbox
        const distance = bboxBounds.maxY - y;
        if (distance > 0 && distance <= maxExtension) {
          intersections.push({ x, y: bboxBounds.maxY, distance });
        }
      }
    }
  } else {
    // Horizontal extension - find intersections with vertical segments
    for (const seg of verticalSegments) {
      if (seg.from.x === seg.to.x) { // Confirm it's vertical
        const segX = seg.from.x;
        const segMinY = Math.min(seg.from.y, seg.to.y);
        const segMaxY = Math.max(seg.from.y, seg.to.y);

        // Check if our ray intersects this vertical segment
        if (y >= segMinY && y <= segMaxY) {
          const distance = Math.abs(segX - x);
          if (distance > 0 && distance <= maxExtension) {
            // Check direction
            if ((direction === 'W' && segX < x) || (direction === 'E' && segX > x)) {
              intersections.push({ x: segX, y, distance });
            }
          }
        }
      }
    }

    // Also find nodes that lie on the same horizontal line
    for (const [_nodeIdStr, node] of nodes) {
      if (node.y === y) {
        const distance = Math.abs(node.x - x);
        if (distance > 0 && distance <= maxExtension) {
          if ((direction === 'W' && node.x < x) || (direction === 'E' && node.x > x)) {
            intersections.push({ x: node.x, y: node.y, distance });
          }
        }
      }
    }

    // Check for intersection with bounding box edges
    if (bboxBounds) {
      if (direction === 'W' && bboxBounds.minX < x) {
        // Ray going west might hit left edge of bbox
        const distance = x - bboxBounds.minX;
        if (distance > 0 && distance <= maxExtension) {
          intersections.push({ x: bboxBounds.minX, y, distance });
        }
      } else if (direction === 'E' && bboxBounds.maxX > x) {
        // Ray going east might hit right edge of bbox
        const distance = bboxBounds.maxX - x;
        if (distance > 0 && distance <= maxExtension) {
          intersections.push({ x: bboxBounds.maxX, y, distance });
        }
      }
    }
  }

  // Sort intersections by distance (closest first) and remove duplicates
  intersections.sort((a, b) => a.distance - b.distance);
  const uniqueIntersections: Array<{ x: number; y: number; distance: number }> = [];
  for (const intersection of intersections) {
    const isDuplicate = uniqueIntersections.some(
      ui => ui.x === intersection.x && ui.y === intersection.y
    );
    if (!isDuplicate) {
      uniqueIntersections.push(intersection);
    }
  }

  

  // Create nodes and edges for each intersection
  let previousNodeId = connectionPointId;
  let previousPoint = { x, y };

  for (const intersection of uniqueIntersections) {
    const intersectionId = nodeId(intersection.x, intersection.y);

    // Add intersection node if it doesn't exist
    const nodeExisted = nodes.has(intersectionId);
    if (!nodeExisted) {
      nodes.set(intersectionId, { x: intersection.x, y: intersection.y, id: intersectionId });
      edges.set(intersectionId, []);
    }

    // Create edge from previous node to this intersection
    const edgeLength = manhattanDistance(previousPoint, intersection);
    edges.get(previousNodeId)!.push({
      from: previousNodeId,
      to: intersectionId,
      direction: direction,
      length: edgeLength
    });

    // Create reverse edge for bidirectional routing
    const reverseDir = DirectionHelpers.reverse(direction);
    edges.get(intersectionId)!.push({
      from: intersectionId,
      to: previousNodeId,
      direction: reverseDir,
      length: edgeLength
    });

    previousNodeId = intersectionId;
    previousPoint = intersection;
  }

  // FALLBACK: If no intersections found, connect to nearest ORTHOGONALLY ALIGNED grid nodes
  if (uniqueIntersections.length === 0) {
    

    // Find nearest nodes in all 4 cardinal directions (must be orthogonally aligned!)
    const nearestNodes: Array<{ node: VisibilityNode; distance: number; direction: Direction }> = [];

    for (const [_nodeIdStr, node] of nodes) {
      if (node.id === connectionPointId) continue; // Skip self

      const dist = manhattanDistance({ x, y }, node);
      if (dist > 0 && dist <= DEFAULT_EXTENSION) {
        // ONLY connect to orthogonally aligned nodes (same X or same Y)
        let dir: Direction | null = null;

        if (node.x === x && node.y !== y) {
          // Vertical alignment
          dir = node.y > y ? 'S' : 'N';
        } else if (node.y === y && node.x !== x) {
          // Horizontal alignment
          dir = node.x > x ? 'E' : 'W';
        }
        // If neither condition met, skip this node (it's diagonal)

        if (dir !== null) {
          nearestNodes.push({ node, distance: dist, direction: dir });
        }
      }
    }

    // Sort by distance and take closest 4
    nearestNodes.sort((a, b) => a.distance - b.distance);
    const closestNodes = nearestNodes.slice(0, 4);

    for (const { node, distance, direction: edgeDir } of closestNodes) {
      // Check if path is clear
      let blocked = false;
      if (edgeDir === 'N' || edgeDir === 'S') {
        for (const shape of shapes) {
          if (verticalSegmentIntersectsShape(x, Math.min(y, node.y), Math.max(y, node.y), shape)) {
            blocked = true;
            break;
          }
        }
      } else {
        for (const shape of shapes) {
          if (horizontalSegmentIntersectsShape(Math.min(x, node.x), Math.max(x, node.x), y, shape)) {
            blocked = true;
            break;
          }
        }
      }

      if (!blocked) {
        // Create bidirectional edges
        edges.get(connectionPointId)!.push({
          from: connectionPointId,
          to: node.id,
          direction: edgeDir,
          length: distance
        });

        const reverseDir = DirectionHelpers.reverse(edgeDir);
        edges.get(node.id)!.push({
          from: node.id,
          to: connectionPointId,
          direction: reverseDir,
          length: distance
        });
      }
    }
  }


}

/**
 * Construct the orthogonal visibility graph
 *
 * Algorithm from paper:
 * 1. Generate interesting horizontal segments
 * 2. Generate interesting vertical segments
 * 3. Compute intersections to create nodes and edges
 * 4. Extend visibility from connection points
 */
export function constructVisibilityGraph(
  shapes: Shape[],
  connectionPoints?: Array<{ x: number; y: number; direction: Direction }>
): OrthogonalVisibilityGraph {
  const nodes = new Map<string, VisibilityNode>();
  const edges = new Map<string, VisibilityEdge[]>();

  // Get all interesting points (offset from shape boundaries)
  // Only shapes with connection points get corner nodes - obstacles don't participate in routing lanes
  const shapeCornerPointsWithOffset = getShapeCornerPointsWithOffset(shapes, connectionPoints);

  // Generate horizontal and vertical segments
  const horizontalSegments = generateHorizontalSegments(shapeCornerPointsWithOffset, shapes, connectionPoints);
  const verticalSegments = generateVerticalSegments(shapeCornerPointsWithOffset, shapes, connectionPoints);

  // Add all interesting points as nodes
  for (const point of shapeCornerPointsWithOffset) {
    const id = nodeId(point.x, point.y);
    if (!nodes.has(id)) {
      nodes.set(id, { x: point.x, y: point.y, id });
      edges.set(id, []);
    }
  }

  // Also create nodes at intersections of horizontal and vertical segments
  for (const hSeg of horizontalSegments) {
    for (const vSeg of verticalSegments) {
      // Check if segments intersect
      const hY = hSeg.from.y;
      const vX = vSeg.from.x;
      const hMinX = Math.min(hSeg.from.x, hSeg.to.x);
      const hMaxX = Math.max(hSeg.from.x, hSeg.to.x);
      const vMinY = Math.min(vSeg.from.y, vSeg.to.y);
      const vMaxY = Math.max(vSeg.from.y, vSeg.to.y);

      if (vX >= hMinX && vX <= hMaxX && hY >= vMinY && hY <= vMaxY) {
        // Segments intersect - create node
        const id = nodeId(vX, hY);
        if (!nodes.has(id)) {
          nodes.set(id, { x: vX, y: hY, id });
          edges.set(id, []);
        }
      }
    }
  }

  // Create bounding box around shapes with connection points
  // This ensures visibility extensions have a proper routing grid to connect to
  let bboxBounds: { minX: number; minY: number; maxX: number; maxY: number } | undefined;

  if (connectionPoints && connectionPoints.length > 0) {
    // Find all shapes that have connection points
    const shapesWithConnections = new Set<Shape>();
    for (const cp of connectionPoints) {
      for (const shape of shapes) {
        const onTop = Math.abs(cp.y - shape.y) < 1 && cp.x >= shape.x && cp.x <= shape.x + shape.width;
        const onBottom = Math.abs(cp.y - (shape.y + shape.height)) < 1 && cp.x >= shape.x && cp.x <= shape.x + shape.width;
        const onLeft = Math.abs(cp.x - shape.x) < 1 && cp.y >= shape.y && cp.y <= shape.y + shape.height;
        const onRight = Math.abs(cp.x - (shape.x + shape.width)) < 1 && cp.y >= shape.y && cp.y <= shape.y + shape.height;
        if (onTop || onBottom || onLeft || onRight) {
          shapesWithConnections.add(shape);
        }
      }
    }

    // Calculate bounding box that contains all shapes with connections and their offset corners
    if (shapesWithConnections.size > 0) {
      const NUDGE = DESIGN_STUDIO_CONFIG.routing.nudgeDistance;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      for (const shape of shapesWithConnections) {
        minX = Math.min(minX, shape.x - NUDGE);
        minY = Math.min(minY, shape.y - NUDGE);
        maxX = Math.max(maxX, shape.x + shape.width + NUDGE);
        maxY = Math.max(maxY, shape.y + shape.height + NUDGE);
      }

      // Expand bounding box by NUDGE distance
      minX -= NUDGE;
      minY -= NUDGE;
      maxX += NUDGE;
      maxY += NUDGE;

      // Store bbox bounds for visibility extension
      bboxBounds = { minX, minY, maxX, maxY };

      // Create nodes at the four corners of the bounding box
      const bboxCorners = [
        { x: minX, y: minY }, // NW
        { x: maxX, y: minY }, // NE
        { x: minX, y: maxY }, // SW
        { x: maxX, y: maxY }  // SE
      ];

      for (const corner of bboxCorners) {
        const id = nodeId(corner.x, corner.y);
        if (!nodes.has(id)) {
          nodes.set(id, { x: corner.x, y: corner.y, id });
          edges.set(id, []);
        }
      }

      // Also create nodes along each edge of the bounding box at the same coordinates
      // as the connection points and offset corners
      const boundaryCoords = new Set<number>();

      // Collect all X coordinates
      for (const cp of connectionPoints) {
        boundaryCoords.add(cp.x);
      }
      for (const shape of shapesWithConnections) {
        boundaryCoords.add(shape.x - NUDGE);
        boundaryCoords.add(shape.x + shape.width + NUDGE);
      }

      // Create nodes on top and bottom edges at these X coordinates
      for (const x of boundaryCoords) {
        if (x > minX && x < maxX) {
          // Top edge
          const topId = nodeId(x, minY);
          if (!nodes.has(topId)) {
            nodes.set(topId, { x, y: minY, id: topId });
            edges.set(topId, []);
          }
          // Bottom edge
          const bottomId = nodeId(x, maxY);
          if (!nodes.has(bottomId)) {
            nodes.set(bottomId, { x, y: maxY, id: bottomId });
            edges.set(bottomId, []);
          }
        }
      }

      // Collect all Y coordinates
      boundaryCoords.clear();
      for (const cp of connectionPoints) {
        boundaryCoords.add(cp.y);
      }
      for (const shape of shapesWithConnections) {
        boundaryCoords.add(shape.y - NUDGE);
        boundaryCoords.add(shape.y + shape.height + NUDGE);
      }

      // Create nodes on left and right edges at these Y coordinates
      for (const y of boundaryCoords) {
        if (y > minY && y < maxY) {
          // Left edge
          const leftId = nodeId(minX, y);
          if (!nodes.has(leftId)) {
            nodes.set(leftId, { x: minX, y, id: leftId });
            edges.set(leftId, []);
          }
          // Right edge
          const rightId = nodeId(maxX, y);
          if (!nodes.has(rightId)) {
            nodes.set(rightId, { x: maxX, y, id: rightId });
            edges.set(rightId, []);
          }
        }
      }
    }
  }

  // First, extend visibility from connection points
  // This creates nodes at intersections that need to be included in the base grid

  // Track all visibility rays so we can find intersections between them
  const visibilityRays: Array<{
    start: Point;
    end: Point;
    direction: Direction;
    isHorizontal: boolean;
  }> = [];

  if (connectionPoints && connectionPoints.length > 0) {
    // Helper function to calculate ray endpoint for a given point and direction
    const calculateRayEndpoint = (x: number, y: number, direction: Direction): Point => {
      let maxExtension = Infinity;
      for (const shape of shapes) {
        switch (direction) {
          case 'N':
            if (x >= shape.x && x <= shape.x + shape.width) {
              const shapeBottom = shape.y + shape.height;
              if (shapeBottom < y) {
                maxExtension = Math.min(maxExtension, y - shapeBottom);
              }
            }
            break;
          case 'S':
            if (x >= shape.x && x <= shape.x + shape.width) {
              const shapeTop = shape.y;
              if (shapeTop > y) {
                maxExtension = Math.min(maxExtension, shapeTop - y);
              }
            }
            break;
          case 'E':
            if (y >= shape.y && y <= shape.y + shape.height) {
              const shapeLeft = shape.x;
              if (shapeLeft > x) {
                maxExtension = Math.min(maxExtension, shapeLeft - x);
              }
            }
            break;
          case 'W':
            if (y >= shape.y && y <= shape.y + shape.height) {
              const shapeRight = shape.x + shape.width;
              if (shapeRight < x) {
                maxExtension = Math.min(maxExtension, x - shapeRight);
              }
            }
            break;
        }
      }

      const DEFAULT_EXTENSION = DESIGN_STUDIO_CONFIG.routing.maxGraphConnectionDistance;
      if (maxExtension === Infinity) {
        maxExtension = DEFAULT_EXTENSION;
      }

      let endX = x, endY = y;
      switch (direction) {
        case 'N':
          endY = y - maxExtension;
          if (bboxBounds && endY < bboxBounds.minY) {
            endY = bboxBounds.minY;
          }
          break;
        case 'S':
          endY = y + maxExtension;
          if (bboxBounds && endY > bboxBounds.maxY) {
            endY = bboxBounds.maxY;
          }
          break;
        case 'E':
          endX = x + maxExtension;
          if (bboxBounds && endX > bboxBounds.maxX) {
            endX = bboxBounds.maxX;
          }
          break;
        case 'W':
          endX = x - maxExtension;
          if (bboxBounds && endX < bboxBounds.minX) {
            endX = bboxBounds.minX;
          }
          break;
      }

      return { x: endX, y: endY };
    };

    // Collect rays from connection points
    for (const connectionPoint of connectionPoints) {
      const { x, y, direction } = connectionPoint;
      const endpoint = calculateRayEndpoint(x, y, direction);

      visibilityRays.push({
        start: { x, y },
        end: endpoint,
        direction,
        isHorizontal: direction === 'E' || direction === 'W'
      });
    }

    // Also collect rays from offset corner points in all 4 directions
    for (const point of shapeCornerPointsWithOffset) {
      // For each corner point, cast rays in all 4 directions
      for (const dir of ['N', 'S', 'E', 'W'] as Direction[]) {
        const endpoint = calculateRayEndpoint(point.x, point.y, dir);

        // Only add the ray if it extends beyond the starting point
        if ((dir === 'N' && endpoint.y < point.y) ||
            (dir === 'S' && endpoint.y > point.y) ||
            (dir === 'E' && endpoint.x > point.x) ||
            (dir === 'W' && endpoint.x < point.x)) {
          visibilityRays.push({
            start: { x: point.x, y: point.y },
            end: endpoint,
            direction: dir,
            isHorizontal: dir === 'E' || dir === 'W'
          });
        }
      }
    }

    // Find all intersections between horizontal and vertical rays
    const rayIntersections: Array<{ x: number; y: number }> = [];

    for (const ray1 of visibilityRays) {
      for (const ray2 of visibilityRays) {
        if (ray1 === ray2) continue;

        // Only check horizontal vs vertical intersections
        if (ray1.isHorizontal && !ray2.isHorizontal) {
          // ray1 is horizontal, ray2 is vertical
          const hY = ray1.start.y;
          const hMinX = Math.min(ray1.start.x, ray1.end.x);
          const hMaxX = Math.max(ray1.start.x, ray1.end.x);

          const vX = ray2.start.x;
          const vMinY = Math.min(ray2.start.y, ray2.end.y);
          const vMaxY = Math.max(ray2.start.y, ray2.end.y);

          // Check if they intersect
          if (vX >= hMinX && vX <= hMaxX && hY >= vMinY && hY <= vMaxY) {
            rayIntersections.push({ x: vX, y: hY });
          }
        }
      }
    }



    // Create nodes at all ray intersections
    for (const intersection of rayIntersections) {
      const id = nodeId(intersection.x, intersection.y);
      if (!nodes.has(id)) {
        nodes.set(id, { x: intersection.x, y: intersection.y, id });
        edges.set(id, []);
      }
    }

    // Second pass: extend visibility from connection points (now with all intersection nodes in place)
    for (const connectionPoint of connectionPoints) {
      extendVisibilityFromConnectionPoint(
        connectionPoint,
        shapes,
        horizontalSegments,
        verticalSegments,
        nodes,
        edges,
        bboxBounds
      );
    }
  }

  // NOW create base grid edges between ALL nodes (including ones created by visibility extensions)
  // For each node, find nearest neighbors in each direction
  const nodeList = Array.from(nodes.values());


  for (const node of nodeList) {
    const nodeEdges = edges.get(node.id)!;

    // Find nearest neighbor to the North
    let nearestN: VisibilityNode | null = null;
    let nearestNDist = Infinity;
    for (const other of nodeList) {
      if (other.x === node.x && other.y > node.y) {
        const dist = other.y - node.y;
        if (dist < nearestNDist) {
          // Check if path is clear
          let blocked = false;
          for (const shape of shapes) {
            if (verticalSegmentIntersectsShape(node.x, node.y, other.y, shape)) {
              blocked = true;
              break;
            }
          }
          if (!blocked) {
            nearestN = other;
            nearestNDist = dist;
          }
        }
      }
    }
    if (nearestN) {
      nodeEdges.push({
        from: node.id,
        to: nearestN.id,
        direction: 'N',
        length: nearestNDist
      });
    }

    // Find nearest neighbor to the South
    let nearestS: VisibilityNode | null = null;
    let nearestSDist = Infinity;
    for (const other of nodeList) {
      if (other.x === node.x && other.y < node.y) {
        const dist = node.y - other.y;
        if (dist < nearestSDist) {
          let blocked = false;
          for (const shape of shapes) {
            if (verticalSegmentIntersectsShape(node.x, other.y, node.y, shape)) {
              blocked = true;
              break;
            }
          }
          if (!blocked) {
            nearestS = other;
            nearestSDist = dist;
          }
        }
      }
    }
    if (nearestS) {
      nodeEdges.push({
        from: node.id,
        to: nearestS.id,
        direction: 'S',
        length: nearestSDist
      });
    }

    // Find nearest neighbor to the East
    let nearestE: VisibilityNode | null = null;
    let nearestEDist = Infinity;
    for (const other of nodeList) {
      if (other.y === node.y && other.x > node.x) {
        const dist = other.x - node.x;
        if (dist < nearestEDist) {
          let blocked = false;
          for (const shape of shapes) {
            if (horizontalSegmentIntersectsShape(node.x, other.x, node.y, shape)) {
              blocked = true;
              break;
            }
          }
          if (!blocked) {
            nearestE = other;
            nearestEDist = dist;
          }
        }
      }
    }
    if (nearestE) {
      nodeEdges.push({
        from: node.id,
        to: nearestE.id,
        direction: 'E',
        length: nearestEDist
      });
    }

    // Find nearest neighbor to the West
    let nearestW: VisibilityNode | null = null;
    let nearestWDist = Infinity;
    for (const other of nodeList) {
      if (other.y === node.y && other.x < node.x) {
        const dist = node.x - other.x;
        if (dist < nearestWDist) {
          let blocked = false;
          for (const shape of shapes) {
            if (horizontalSegmentIntersectsShape(other.x, node.x, node.y, shape)) {
              blocked = true;
              break;
            }
          }
          if (!blocked) {
            nearestW = other;
            nearestWDist = dist;
          }
        }
      }
    }
    if (nearestW) {
      nodeEdges.push({
        from: node.id,
        to: nearestW.id,
        direction: 'W',
        length: nearestWDist
      });
    }
  }

  // REMOVED: Corner visibility extension code
  // Obstacles (shapes) now only BLOCK paths via the intersection checks in the edge creation code above
  // They do NOT create their own visibility edges - this prevents weird routing along obstacle boundaries


  return { nodes, edges };
}

/**
 * Estimate remaining segments needed to reach destination
 * Based on Figure 2(a) from the paper
 */
function estimateRemainingSegments(
  current: Point,
  currentDir: Direction,
  destination: Point,
  destDir: Direction
): number {
  const dirs = DirectionHelpers.dirns(current, destination);

  // Case 0: Already at destination with correct direction
  if (currentDir === destDir && dirs.size === 1 && dirs.has(currentDir)) {
    return 0;
  }

  // Case 1: Perpendicular to destination direction and moving toward it
  if ((DirectionHelpers.left(destDir) === currentDir ||
       DirectionHelpers.right(destDir) === currentDir) &&
      dirs.has(currentDir)) {
    return 1;
  }

  // Case 2: Same direction as destination or opposite but not aligned
  if ((currentDir === destDir && (dirs.size !== 1 || !dirs.has(currentDir))) ||
      (currentDir === DirectionHelpers.reverse(destDir) &&
       (dirs.size !== 1 || !dirs.has(destDir)))) {
    return 2;
  }

  // Case 3: Perpendicular but not moving toward destination
  if ((DirectionHelpers.left(destDir) === currentDir ||
       DirectionHelpers.right(destDir) === currentDir) &&
      !dirs.has(currentDir)) {
    return 3;
  }

  // Case 4: Opposite direction
  if ((currentDir === DirectionHelpers.reverse(destDir) &&
       dirs.size === 1 && dirs.has(destDir)) ||
      (currentDir === destDir && !dirs.has(currentDir))) {
    return 4;
  }

  return 3; // Default estimate
}

/**
 * Find optimal route through visibility graph using A* search
 *
 * Cost function: combines path length and bend count
 * State: (node, entry_direction)
 */
// Store last visited nodes for debugging
let lastVisitedNodes: Array<{ x: number; y: number; order: number }> = [];

export function getLastVisitedNodes(): Array<{ x: number; y: number; order: number }> {
  return lastVisitedNodes;
}

export function findOptimalRoute(
  graph: OrthogonalVisibilityGraph,
  start: Point,
  end: Point,
  startDir: Direction,
  endDir: Direction,
  _shapes: Shape[],
): Point[] {
  // Connection points should already have visibility edges in the graph
  // No nudging needed - route directly from start to end using the visibility graph

  const startId = nodeId(start.x, start.y);
  const endId = nodeId(end.x, end.y);

  // Verify start and end nodes exist in graph
  if (!graph.nodes.has(startId)) {
    return [start, end];
  }
  if (!graph.nodes.has(endId)) {
    return [start, end];
  }

  // CHECK FOR ZERO EDGES (critical!)
  const startEdges = graph.edges.get(startId) || [];
  const endEdges = graph.edges.get(endId) || [];

  if (startEdges.length === 0) {
    return [start, end];
  }
  if (endEdges.length === 0) {
    return [start, end];
  }



  // Priority queue for A* (min-heap by cost)
  const openSet: SearchState[] = [];
  const closedSet = new Set<string>();

  // Initialize with the start point
  const initialState: SearchState = {
    nodeId: startId,
    entryDirection: startDir,
    pathLength: 0,
    bendCount: 0,
    cost: 0,
    parent: null
  };
  openSet.push(initialState);

  // State key for closed set
  const stateKey = (nodeId: string) => nodeId;

  // Track visited nodes for debugging
  const visitedNodes: Array<{ x: number; y: number; order: number }> = [];
  let visitOrder = 0;

  // A* search
  let iterations = 0;
  while (openSet.length > 0 && iterations < 1000) {
    iterations++;

    // Get state with lowest cost
    openSet.sort((a, b) => a.cost - b.cost);
    const current = openSet.shift()!;

    const currentKey = stateKey(current.nodeId);
    if (closedSet.has(currentKey)) continue;
    closedSet.add(currentKey);

    // Track this visit for debugging
    const currentNodePos = graph.nodes.get(current.nodeId);
    if (currentNodePos) {
      visitedNodes.push({ x: currentNodePos.x, y: currentNodePos.y, order: visitOrder++ });
    }


    // Check if we reached the destination
    if (current.nodeId === endId) {
      // Reconstruct path from start to end
      const path: Point[] = [];
      let state: SearchState | null = current;
      while (state) {
        const node = graph.nodes.get(state.nodeId)!;
        path.unshift({ x: node.x, y: node.y });
        state = state.parent;
      }

      // Store visited nodes for debugging
      lastVisitedNodes = visitedNodes;
      return path;
    }

    // Expand neighbors
    const nodeEdges = graph.edges.get(current.nodeId) || [];



    for (const edge of nodeEdges) {
      const neighbor = graph.nodes.get(edge.to);
      if (!neighbor) {
        continue;
      }
      const neighborKey = stateKey(edge.to);

      if (closedSet.has(neighborKey)) continue;

      // Calculate cost
      const newLength = current.pathLength + edge.length;
      const newBends = current.bendCount + (edge.direction === current.entryDirection ? 0 : 1);
      const estimatedRemaining = estimateRemainingSegments(
        { x: neighbor.x, y: neighbor.y },
        edge.direction,
        end,
        endDir
      );
      const estimatedRemainingLength = manhattanDistance({ x: neighbor.x, y: neighbor.y }, end);
      const newCost = newLength + (newBends * 1) +
                     estimatedRemainingLength + (estimatedRemaining * 1);

      // Add to open set
      const newState: SearchState = {
        nodeId: edge.to,
        entryDirection: edge.direction,
        pathLength: newLength,
        bendCount: newBends,
        cost: newCost,
        parent: current
      };

      // Check if we already have this node in open set
      const existingIndex = openSet.findIndex(s => s.nodeId === edge.to);
      if (existingIndex >= 0) {
        // Only replace if the new path has lower cost
        if (newCost < openSet[existingIndex].cost) {
          openSet[existingIndex] = newState;
        }
      } else {
        openSet.push(newState);
      }
    }
  }

  lastVisitedNodes = visitedNodes;
  return [start, end];
}

/**
 * Refine route by nudging segments away from shape boundaries
 * This implements the "nudging" stage from Wybrow et al.
 * - Adds spacing from shape edges for better visual appearance
 * - Centers segments in available space between obstacles
 */
export function refineRoute(route: Point[], shapes: Shape[]): Point[] {
  if (route.length < 3) return route;

  const NUDGE_DISTANCE = DESIGN_STUDIO_CONFIG.routing.nudgeDistance;

  const refined: Point[] = [route[0]]; // Keep start point

  // Process each segment between points
  for (let i = 1; i < route.length; i++) {
    const prevPoint = refined[refined.length - 1];
    const currPoint = route[i];

    // Determine if segment is horizontal or vertical
    const isHorizontal = prevPoint.y === currPoint.y;
    const isVertical = prevPoint.x === currPoint.x;

    if (isHorizontal) {
      // Check if this horizontal segment is too close to any shape boundaries
      let nudgedY = currPoint.y;
      let minDistToShape = Infinity;
      let closestShapeEdge: 'top' | 'bottom' | null = null;

      const segMinX = Math.min(prevPoint.x, currPoint.x);
      const segMaxX = Math.max(prevPoint.x, currPoint.x);

      for (const shape of shapes) {
        // Check if this shape overlaps horizontally with the segment
        if (shape.x <= segMaxX && shape.x + shape.width >= segMinX) {
          // Check distance to top edge
          const distToTop = Math.abs(currPoint.y - (shape.y + shape.height));
          if (distToTop < minDistToShape && distToTop < NUDGE_DISTANCE) {
            minDistToShape = distToTop;
            closestShapeEdge = 'top';
          }

          // Check distance to bottom edge
          const distToBottom = Math.abs(currPoint.y - shape.y);
          if (distToBottom < minDistToShape && distToBottom < NUDGE_DISTANCE) {
            minDistToShape = distToBottom;
            closestShapeEdge = 'bottom';
          }
        }
      }

      // Nudge away from closest edge if too close
      if (closestShapeEdge === 'top') {
        // Find the shape we're nudging away from
        for (const shape of shapes) {
          if (shape.x <= segMaxX && shape.x + shape.width >= segMinX) {
            const distToTop = Math.abs(currPoint.y - (shape.y + shape.height));
            if (distToTop === minDistToShape) {
              // Nudge down (away from top edge)
              nudgedY = shape.y + shape.height + NUDGE_DISTANCE;
              break;
            }
          }
        }
      } else if (closestShapeEdge === 'bottom') {
        // Find the shape we're nudging away from
        for (const shape of shapes) {
          if (shape.x <= segMaxX && shape.x + shape.width >= segMinX) {
            const distToBottom = Math.abs(currPoint.y - shape.y);
            if (distToBottom === minDistToShape) {
              // Nudge up (away from bottom edge)
              nudgedY = shape.y - NUDGE_DISTANCE;
              break;
            }
          }
        }
      }

      // Add point with nudged Y coordinate
      if (nudgedY !== prevPoint.y) {
        // Need to add a bend to change Y
        refined.push({ x: prevPoint.x, y: nudgedY });
        refined.push({ x: currPoint.x, y: nudgedY });
      } else {
        refined.push({ x: currPoint.x, y: nudgedY });
      }
    } else if (isVertical) {
      // Check if this vertical segment is too close to any shape boundaries
      let nudgedX = currPoint.x;
      let minDistToShape = Infinity;
      let closestShapeEdge: 'left' | 'right' | null = null;

      const segMinY = Math.min(prevPoint.y, currPoint.y);
      const segMaxY = Math.max(prevPoint.y, currPoint.y);

      for (const shape of shapes) {
        // Check if this shape overlaps vertically with the segment
        if (shape.y <= segMaxY && shape.y + shape.height >= segMinY) {
          // Check distance to right edge
          const distToRight = Math.abs(currPoint.x - (shape.x + shape.width));
          if (distToRight < minDistToShape && distToRight < NUDGE_DISTANCE) {
            minDistToShape = distToRight;
            closestShapeEdge = 'right';
          }

          // Check distance to left edge
          const distToLeft = Math.abs(currPoint.x - shape.x);
          if (distToLeft < minDistToShape && distToLeft < NUDGE_DISTANCE) {
            minDistToShape = distToLeft;
            closestShapeEdge = 'left';
          }
        }
      }

      // Nudge away from closest edge if too close
      if (closestShapeEdge === 'right') {
        // Find the shape we're nudging away from
        for (const shape of shapes) {
          if (shape.y <= segMaxY && shape.y + shape.height >= segMinY) {
            const distToRight = Math.abs(currPoint.x - (shape.x + shape.width));
            if (distToRight === minDistToShape) {
              // Nudge right (away from right edge)
              nudgedX = shape.x + shape.width + NUDGE_DISTANCE;
              break;
            }
          }
        }
      } else if (closestShapeEdge === 'left') {
        // Find the shape we're nudging away from
        for (const shape of shapes) {
          if (shape.y <= segMaxY && shape.y + shape.height >= segMinY) {
            const distToLeft = Math.abs(currPoint.x - shape.x);
            if (distToLeft === minDistToShape) {
              // Nudge left (away from left edge)
              nudgedX = shape.x - NUDGE_DISTANCE;
              break;
            }
          }
        }
      }

      // Add point with nudged X coordinate
      if (nudgedX !== prevPoint.x) {
        // Need to add a bend to change X
        refined.push({ x: nudgedX, y: prevPoint.y });
        refined.push({ x: nudgedX, y: currPoint.y });
      } else {
        refined.push({ x: nudgedX, y: currPoint.y });
      }
    } else {
      // Diagonal segment (shouldn't happen in orthogonal routing)
      refined.push(currPoint);
    }
  }

  return refined;
}

/**
 * Simplify route by merging collinear segments
 */
export function simplifyRoute(route: Point[]): Point[] {
  if (route.length < 3) return route;

  const simplified: Point[] = [route[0]];

  for (let i = 1; i < route.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = route[i];
    const next = route[i + 1];

    // Check if current point is on the line between prev and next
    const isCollinear =
      (prev.x === curr.x && curr.x === next.x) || // Vertical line
      (prev.y === curr.y && curr.y === next.y);   // Horizontal line

    if (!isCollinear) {
      simplified.push(curr);
    }
  }

  simplified.push(route[route.length - 1]);

  return simplified;
}

/**
 * Simple cache for visibility graphs
 * Key is based on shape positions and sizes
 */
const visibilityGraphCache = new Map<string, {
  graph: OrthogonalVisibilityGraph;
  timestamp: number;
}>();

const CACHE_TTL = DESIGN_STUDIO_CONFIG.cache.visibilityGraphTTL;
const MAX_CACHE_SIZE = DESIGN_STUDIO_CONFIG.cache.maxCacheSize;

/**
 * Generate a cache key from shapes
 */
function getShapeCacheKey(shapes: Shape[]): string {
  // Create a string representation of all shape positions and sizes
  // Sort by ID to ensure consistent key regardless of array order
  const sorted = [...shapes].sort((a, b) => a.id.localeCompare(b.id));
  return sorted.map(s => `${s.id}:${s.x},${s.y},${s.width},${s.height}`).join('|');
}

/**
 * Get visibility graph from cache or construct new one
 */
function _getCachedVisibilityGraph(
  shapes: Shape[],
  connectionCorridors?: Array<{ x: number; y: number; direction: Direction }>
): OrthogonalVisibilityGraph {
  const key = getShapeCacheKey(shapes);
  const now = Date.now();

  // Only use cache if there are no connection corridors
  // (corridors vary per connector, so we can't cache them)
  if (!connectionCorridors) {
    // Check cache
    const cached = visibilityGraphCache.get(key);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return cached.graph;
    }
  }

  // Construct new graph
  const graph = constructVisibilityGraph(shapes, connectionCorridors);

  // Add to cache only if no connection corridors
  if (!connectionCorridors) {
    visibilityGraphCache.set(key, { graph, timestamp: now });
  }

  // Evict old entries if cache is too large
  if (visibilityGraphCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entry
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of visibilityGraphCache.entries()) {
      if (v.timestamp < oldestTime) {
        oldestTime = v.timestamp;
        oldestKey = k;
      }
    }
    if (oldestKey) {
      visibilityGraphCache.delete(oldestKey);
    }
  }

  return graph;
}

/**
 * Clear the visibility graph cache
 * Useful when shapes are modified
 */
export function clearVisibilityGraphCache(): void {
  visibilityGraphCache.clear();
}

/**
 * Main entry point: Find optimal orthogonal route between two points
 */
export function findOrthogonalRoute(
  start: Point,
  end: Point,
  shapes: Shape[],
  startDir: Direction = 'E',
  endDir: Direction = 'W',
  _refine: boolean = true,
  _useCache: boolean = true,
  connectionPoints?: Array<{ x: number; y: number; direction: Direction }>
): Point[] {
  // Connection points must always be included, so we can't use cache when they're provided
  // Build a fresh graph with all connection points integrated
  const graph = constructVisibilityGraph(shapes, connectionPoints);

  // Find optimal route
  let route = findOptimalRoute(graph, start, end, startDir, endDir, shapes);


  // Debug: Send graph data to debug overlay
  if (typeof window !== 'undefined') {
    try {
      const setDebugGraph = (window as Window & {
        setRoutingDebugGraph?: (
          graph: OrthogonalVisibilityGraph,
          start: Point,
          end: Point,
          route: Point[],
          visitedNodes: Array<{ x: number; y: number; order: number }>
        ) => void
      }).setRoutingDebugGraph;
      if (setDebugGraph) {
        setDebugGraph(graph, start, end, route, lastVisitedNodes);
      }
    } catch (_e) {
      // Ignore - debug overlay not available
    }
  }


  // Refine route (centering in alleys)
  // NOTE: Refinement is now disabled because we build the nudge offset directly into
  // the visibility graph construction (see getInterestingPoints). This creates cleaner
  // routes that naturally maintain spacing from shapes without post-processing.
  // The refine parameter is kept for backward compatibility but not used.
  // if (refine && route.length > 2) {
  //   route = refineRoute(route, shapes);
  // }

  // Simplify by merging collinear segments
  route = simplifyRoute(route);

  return route;
}
