/**
 * Orthogonal Connector Routing Algorithm
 * Based on Wybrow, Marriott, and Stuckey (2009)
 * "Orthogonal Connector Routing" - Graph Drawing 2009
 *
 * This module implements optimal object-avoiding orthogonal connector routing
 * using a three-stage approach:
 * 1. Construct orthogonal visibility graph
 * 2. Find optimal route using A* search
 * 3. Refine visual representation with nudging
 */

import type { Shape, Point } from "~/core/entities/design-studio/types/Shape";

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
 */
function nodeId(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Check if a horizontal line segment intersects with a shape
 */
function horizontalSegmentIntersectsShape(
  x1: number,
  x2: number,
  y: number,
  shape: Shape
): boolean {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);

  // Check if segment passes THROUGH shape (not just touching edge)
  // Allow segments along the boundary
  return !(
    maxX <= shape.x ||
    minX >= shape.x + shape.width ||
    y <= shape.y ||
    y >= shape.y + shape.height
  );
}

/**
 * Check if a vertical line segment intersects with a shape
 */
function verticalSegmentIntersectsShape(
  x: number,
  y1: number,
  y2: number,
  shape: Shape
): boolean {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  // Check if segment passes THROUGH shape (not just touching edge)
  // Allow segments along the boundary
  return !(
    x <= shape.x ||
    x >= shape.x + shape.width ||
    maxY <= shape.y ||
    minY >= shape.y + shape.height
  );
}

/**
 * Get all interesting points from shapes
 * (corners and connection points)
 */
function getInterestingPoints(shapes: Shape[]): Point[] {
  const points: Point[] = [];

  for (const shape of shapes) {
    // Add corners of bounding box
    points.push({ x: shape.x, y: shape.y });
    points.push({ x: shape.x + shape.width, y: shape.y });
    points.push({ x: shape.x, y: shape.y + shape.height });
    points.push({ x: shape.x + shape.width, y: shape.y + shape.height });

    // TODO: Add connection points if needed
    // For now, corners provide sufficient granularity
  }

  return points;
}

/**
 * Generate all interesting horizontal segments
 * (segments between interesting points with no intervening objects)
 */
function generateHorizontalSegments(
  interestingPoints: Point[],
  shapes: Shape[]
): Array<{ from: Point; to: Point }> {
  const segments: Array<{ from: Point; to: Point }> = [];

  // Group points by y coordinate
  const pointsByY = new Map<number, Point[]>();
  for (const point of interestingPoints) {
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
        if (horizontalSegmentIntersectsShape(p1.x, p2.x, y, shape)) {
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
  shapes: Shape[]
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
        if (verticalSegmentIntersectsShape(x, p1.y, p2.y, shape)) {
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
 * Construct the orthogonal visibility graph
 *
 * Algorithm from paper:
 * 1. Generate interesting horizontal segments
 * 2. Generate interesting vertical segments
 * 3. Compute intersections to create nodes and edges
 */
export function constructVisibilityGraph(shapes: Shape[]): OrthogonalVisibilityGraph {
  const nodes = new Map<string, VisibilityNode>();
  const edges = new Map<string, VisibilityEdge[]>();

  // Get all interesting points
  const interestingPoints = getInterestingPoints(shapes);

  // Generate horizontal and vertical segments
  const horizontalSegments = generateHorizontalSegments(interestingPoints, shapes);
  const verticalSegments = generateVerticalSegments(interestingPoints, shapes);

  // First, add all interesting points as nodes (shape corners)
  // This ensures we have routing points even with a single obstacle
  for (const point of interestingPoints) {
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

  // Create edges between nodes
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
  shapes: Shape[],
  bendPenalty: number = 50 // Weight for bends vs length
): Point[] {
  const NUDGE_DISTANCE = 20; // Distance from shape boundaries for entry/exit

  // Create nudged start and end points that are offset in the specified direction
  // This ensures connectors leave/enter in the correct direction with spacing
  const getNudgedPoint = (point: Point, direction: Direction, distance: number): Point => {
    switch (direction) {
      case 'N': return { x: point.x, y: point.y - distance };
      case 'S': return { x: point.x, y: point.y + distance };
      case 'E': return { x: point.x + distance, y: point.y };
      case 'W': return { x: point.x - distance, y: point.y };
    }
  };

  // Calculate halfway distance between start and end in the perpendicular direction
  const getHalfwayDistance = (start: Point, end: Point, direction: Direction): number => {
    switch (direction) {
      case 'N':
      case 'S':
        return Math.abs(end.y - start.y) / 2;
      case 'E':
      case 'W':
        return Math.abs(end.x - start.x) / 2;
    }
  };

  // Helper to check if a nudge segment is blocked
  const isNudgeSegmentBlocked = (p1: Point, p2: Point): boolean => {
    for (const shape of shapes) {
      // Check if horizontal segment
      if (p1.y === p2.y) {
        if (horizontalSegmentIntersectsShape(Math.min(p1.x, p2.x), Math.max(p1.x, p2.x), p1.y, shape)) {
          return true;
        }
      }
      // Check if vertical segment
      if (p1.x === p2.x) {
        if (verticalSegmentIntersectsShape(p1.x, Math.min(p1.y, p2.y), Math.max(p1.y, p2.y), shape)) {
          return true;
        }
      }
    }
    return false;
  };

  // Calculate safe nudge distances, checking for obstacles
  const calculateSafeNudgeDistance = (point: Point, direction: Direction): number => {
    const maxDistance = getHalfwayDistance(start, end, direction);

    // Try the halfway distance first
    const halfwayDist = Math.max(NUDGE_DISTANCE * 2, maxDistance);
    const halfwayPoint = getNudgedPoint(point, direction, halfwayDist);

    // Check if the path to halfway point is clear
    if (!isNudgeSegmentBlocked(point, halfwayPoint)) {
      return halfwayDist;
    }

    // If halfway is blocked, just use the minimum nudge distance
    return NUDGE_DISTANCE;
  };

  const halfwayStartDist = calculateSafeNudgeDistance(start, startDir);
  const halfwayEndDist = calculateSafeNudgeDistance(end, endDir);

  // Create nudge points at two distances: initial nudge and halfway point (or minimum if blocked)
  const nudgedStart1 = getNudgedPoint(start, startDir, NUDGE_DISTANCE);
  const nudgedEnd1 = getNudgedPoint(end, endDir, NUDGE_DISTANCE);

  // Only create second nudge points if they're different from first (i.e., halfway wasn't blocked)
  const useStartNudge2 = halfwayStartDist > NUDGE_DISTANCE;
  const useEndNudge2 = halfwayEndDist > NUDGE_DISTANCE;

  const nudgedStart2 = useStartNudge2 ? getNudgedPoint(start, startDir, halfwayStartDist) : nudgedStart1;
  const nudgedEnd2 = useEndNudge2 ? getNudgedPoint(end, endDir, halfwayEndDist) : nudgedEnd1;

  // Find or create start and end nodes in graph
  const startId = nodeId(start.x, start.y);
  const nudgedStart1Id = nodeId(nudgedStart1.x, nudgedStart1.y);
  const nudgedStart2Id = nodeId(nudgedStart2.x, nudgedStart2.y);
  const endId = nodeId(end.x, end.y);
  const nudgedEnd1Id = nodeId(nudgedEnd1.x, nudgedEnd1.y);
  const nudgedEnd2Id = nodeId(nudgedEnd2.x, nudgedEnd2.y);

  // Add the actual connection points to the graph
  if (!graph.nodes.has(startId)) {
    graph.nodes.set(startId, { x: start.x, y: start.y, id: startId });
    graph.edges.set(startId, []);
  }
  if (!graph.nodes.has(endId)) {
    graph.nodes.set(endId, { x: end.x, y: end.y, id: endId });
    graph.edges.set(endId, []);
  }

  // Add the first nudged points to the graph
  if (!graph.nodes.has(nudgedStart1Id)) {
    graph.nodes.set(nudgedStart1Id, { x: nudgedStart1.x, y: nudgedStart1.y, id: nudgedStart1Id });
    graph.edges.set(nudgedStart1Id, []);
  }
  if (!graph.nodes.has(nudgedEnd1Id)) {
    graph.nodes.set(nudgedEnd1Id, { x: nudgedEnd1.x, y: nudgedEnd1.y, id: nudgedEnd1Id });
    graph.edges.set(nudgedEnd1Id, []);
  }

  // Add the second nudged points to the graph
  if (!graph.nodes.has(nudgedStart2Id)) {
    graph.nodes.set(nudgedStart2Id, { x: nudgedStart2.x, y: nudgedStart2.y, id: nudgedStart2Id });
    graph.edges.set(nudgedStart2Id, []);
  }
  if (!graph.nodes.has(nudgedEnd2Id)) {
    graph.nodes.set(nudgedEnd2Id, { x: nudgedEnd2.x, y: nudgedEnd2.y, id: nudgedEnd2Id });
    graph.edges.set(nudgedEnd2Id, []);
  }

  // Connect start -> nudgedStart1 (-> nudgedStart2 if different)
  const startEdges = graph.edges.get(startId)!;
  startEdges.push({
    from: startId,
    to: nudgedStart1Id,
    direction: startDir,
    length: NUDGE_DISTANCE
  });

  // Only add the second segment if nudgedStart2 is different from nudgedStart1
  if (useStartNudge2) {
    const nudgedStart1Edges = graph.edges.get(nudgedStart1Id)!;
    nudgedStart1Edges.push({
      from: nudgedStart1Id,
      to: nudgedStart2Id,
      direction: startDir,
      length: halfwayStartDist - NUDGE_DISTANCE
    });
  }

  // Connect (nudgedEnd2 ->) nudgedEnd1 -> end
  // Only add the first segment if nudgedEnd2 is different from nudgedEnd1
  if (useEndNudge2) {
    const nudgedEnd2Edges = graph.edges.get(nudgedEnd2Id)!;
    nudgedEnd2Edges.push({
      from: nudgedEnd2Id,
      to: nudgedEnd1Id,
      direction: endDir,
      length: halfwayEndDist - NUDGE_DISTANCE
    });
  }

  const nudgedEnd1Edges = graph.edges.get(nudgedEnd1Id)!;
  nudgedEnd1Edges.push({
    from: nudgedEnd1Id,
    to: endId,
    direction: endDir,
    length: NUDGE_DISTANCE
  });

  // Helper function to connect a point to the visibility graph
  // For connector endpoints, we create intermediate nodes at shape corner X/Y coordinates
  const connectPointToGraph = (point: Point, pointId: string, shapes: Shape[]) => {
    if (!graph.nodes.has(pointId)) {
      graph.nodes.set(pointId, { x: point.x, y: point.y, id: pointId });
      graph.edges.set(pointId, []);
    }

    const pointEdges = graph.edges.get(pointId)!;
    const allNodes = Array.from(graph.nodes.values()).filter(n => n.id !== pointId);

    // Limit connections to reasonable nearby nodes (within a distance threshold)
    // This prevents creating thousands of edges from start/end to every node
    const maxDistance = 2000; // Reasonable threshold for connection attempts
    const nodeList = allNodes.filter(n => {
      const dist = Math.abs(n.x - point.x) + Math.abs(n.y - point.y);
      return dist < maxDistance;
    });

    let _edgesCreated = 0;
    // For each existing node, create a perpendicular connection via an intermediate point
    for (const other of nodeList) {
      // Verify other still exists in graph
      if (!graph.nodes.has(other.id)) continue;

      // Skip if same point
      if (point.x === other.x && point.y === other.y) continue;

      // Try BOTH orientations: horizontal-then-vertical AND vertical-then-horizontal

      // Option 1: point -> (other.x, point.y) -> other (horizontal first)
      const intermediateH = { x: other.x, y: point.y };
      const intermediateHId = nodeId(intermediateH.x, intermediateH.y);

      let hBlocked = false;
      for (const shape of shapes) {
        if (horizontalSegmentIntersectsShape(Math.min(point.x, other.x), Math.max(point.x, other.x), point.y, shape)) {
          hBlocked = true;
          break;
        }
      }

      let vBlocked = false;
      for (const shape of shapes) {
        if (verticalSegmentIntersectsShape(other.x, Math.min(point.y, other.y), Math.max(point.y, other.y), shape)) {
          vBlocked = true;
          break;
        }
      }

      if (!hBlocked && !vBlocked && (point.x !== other.x || point.y !== other.y)) {
        // Connect point -> intermediate (horizontal) -> other (vertical)
        if (point.x !== other.x && point.y !== other.y) {
          // Add intermediate node if it doesn't exist
          if (!graph.nodes.has(intermediateHId)) {
            graph.nodes.set(intermediateHId, { x: intermediateH.x, y: intermediateH.y, id: intermediateHId });
            graph.edges.set(intermediateHId, []);
          }

          const dir: Direction = other.x > point.x ? 'E' : 'W';
          pointEdges.push({
            from: pointId,
            to: intermediateHId,
            direction: dir,
            length: Math.abs(other.x - point.x)
          });

          // Connect intermediate -> other (vertical)
          const vDir: Direction = other.y > point.y ? 'S' : 'N';
          const intermediateEdges = graph.edges.get(intermediateHId)!;
          intermediateEdges.push({
            from: intermediateHId,
            to: other.id,
            direction: vDir,
            length: Math.abs(other.y - point.y)
          });

          // BIDIRECTIONAL: Add reverse edges so the end point can be reached
          const reverseDir: Direction = other.x > point.x ? 'W' : 'E';
          intermediateEdges.push({
            from: intermediateHId,
            to: pointId,
            direction: reverseDir,
            length: Math.abs(other.x - point.x)
          });

          const reverseVDir: Direction = other.y > point.y ? 'N' : 'S';
          const otherEdges = graph.edges.get(other.id)!;
          otherEdges.push({
            from: other.id,
            to: intermediateHId,
            direction: reverseVDir,
            length: Math.abs(other.y - point.y)
          });

          _edgesCreated += 4;
        } else if (point.y !== other.y) {
          // Direct vertical connection (same x)
          const vDir: Direction = other.y > point.y ? 'S' : 'N';
          pointEdges.push({
            from: pointId,
            to: other.id,
            direction: vDir,
            length: Math.abs(other.y - point.y)
          });

          // BIDIRECTIONAL: Add reverse edge
          const reverseVDir: Direction = other.y > point.y ? 'N' : 'S';
          const otherEdges = graph.edges.get(other.id)!;
          otherEdges.push({
            from: other.id,
            to: pointId,
            direction: reverseVDir,
            length: Math.abs(other.y - point.y)
          });
          _edgesCreated += 2;
        } else if (point.x !== other.x) {
          // Direct horizontal connection (same y)
          const hDir: Direction = other.x > point.x ? 'E' : 'W';
          pointEdges.push({
            from: pointId,
            to: other.id,
            direction: hDir,
            length: Math.abs(other.x - point.x)
          });

          // BIDIRECTIONAL: Add reverse edge
          const reverseHDir: Direction = other.x > point.x ? 'W' : 'E';
          const otherEdges = graph.edges.get(other.id)!;
          otherEdges.push({
            from: other.id,
            to: pointId,
            direction: reverseHDir,
            length: Math.abs(other.x - point.x)
          });
          _edgesCreated += 2;
        }
      }

      // Option 2: point -> (point.x, other.y) -> other (vertical first)
      const intermediateV = { x: point.x, y: other.y };
      const intermediateVId = nodeId(intermediateV.x, intermediateV.y);

      // Only try this if it's different from horizontal-first approach
      if (intermediateVId !== intermediateHId && intermediateVId !== pointId && intermediateVId !== other.id) {
        let v2Blocked = false;
        for (const shape of shapes) {
          if (verticalSegmentIntersectsShape(point.x, Math.min(point.y, other.y), Math.max(point.y, other.y), shape)) {
            v2Blocked = true;
            break;
          }
        }

        let h2Blocked = false;
        for (const shape of shapes) {
          if (horizontalSegmentIntersectsShape(Math.min(point.x, other.x), Math.max(point.x, other.x), other.y, shape)) {
            h2Blocked = true;
            break;
          }
        }

        if (!v2Blocked && !h2Blocked && point.x !== other.x && point.y !== other.y) {
          // Add intermediate node if it doesn't exist
          if (!graph.nodes.has(intermediateVId)) {
            graph.nodes.set(intermediateVId, { x: intermediateV.x, y: intermediateV.y, id: intermediateVId });
            graph.edges.set(intermediateVId, []);
          }

          const vDir: Direction = other.y > point.y ? 'S' : 'N';
          pointEdges.push({
            from: pointId,
            to: intermediateVId,
            direction: vDir,
            length: Math.abs(other.y - point.y)
          });

          // Connect intermediate -> other (horizontal)
          const hDir: Direction = other.x > point.x ? 'E' : 'W';
          const intermediateVEdges = graph.edges.get(intermediateVId)!;
          intermediateVEdges.push({
            from: intermediateVId,
            to: other.id,
            direction: hDir,
            length: Math.abs(other.x - point.x)
          });

          // BIDIRECTIONAL: Add reverse edges
          const reverseVDir: Direction = other.y > point.y ? 'N' : 'S';
          intermediateVEdges.push({
            from: intermediateVId,
            to: pointId,
            direction: reverseVDir,
            length: Math.abs(other.y - point.y)
          });

          const reverseHDir: Direction = other.x > point.x ? 'W' : 'E';
          const otherEdges = graph.edges.get(other.id)!;
          otherEdges.push({
            from: other.id,
            to: intermediateVId,
            direction: reverseHDir,
            length: Math.abs(other.x - point.x)
          });

          _edgesCreated += 4;
        }
      }
    }
  };

  // Connect the outer nudged points to the visibility graph
  // These are the points that route through the graph (not the actual connection points)
  connectPointToGraph(nudgedStart2, nudgedStart2Id, shapes);
  connectPointToGraph(nudgedEnd2, nudgedEnd2Id, shapes);

  // Priority queue for A* (min-heap by cost)
  const openSet: SearchState[] = [];
  const closedSet = new Set<string>(); // Set of nodeId only (no direction)

  // Initialize with the outer nudged start point
  // The path will be: start -> nudgedStart1 -> nudgedStart2 -> [graph route] -> nudgedEnd2 -> nudgedEnd1 -> end
  const initialState: SearchState = {
    nodeId: nudgedStart2Id,
    entryDirection: startDir,
    pathLength: 0,
    bendCount: 0,
    cost: 0,
    parent: null
  };
  openSet.push(initialState);

  // State key for closed set - ONLY use nodeId, not direction
  // This allows the same node to be reached from different directions
  const stateKey = (nodeId: string) => nodeId;

  // Track visited nodes for debugging
  const visitedNodes: Array<{ x: number; y: number; order: number }> = [];
  let visitOrder = 0;

  // A* search
  while (openSet.length > 0) {
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

    // Check if we reached the destination (outer nudged end point)
    if (current.nodeId === nudgedEnd2Id) {
      // Reconstruct path from nudgedStart2 to nudgedEnd2
      const path: Point[] = [];
      let state: SearchState | null = current;
      while (state) {
        const node = graph.nodes.get(state.nodeId)!;
        path.unshift({ x: node.x, y: node.y });
        state = state.parent;
      }

      // Add the entry sequence: nudgedEnd1 -> end
      path.push(nudgedEnd1);
      path.push(end);

      // Add the exit sequence at the beginning: start -> nudgedStart1
      path.unshift(nudgedStart1);
      path.unshift(start);

      // Store visited nodes for debugging
      lastVisitedNodes = visitedNodes;
      return path;
    }

    // Expand neighbors
    const _currentNode = graph.nodes.get(current.nodeId)!;
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
      const newCost = newLength + (newBends * bendPenalty) +
                     estimatedRemainingLength + (estimatedRemaining * bendPenalty);

      // Add to open set
      const newState: SearchState = {
        nodeId: edge.to,
        entryDirection: edge.direction,
        pathLength: newLength,
        bendCount: newBends,
        cost: newCost,
        parent: current
      };

      // Check if we already have this node in open set (regardless of direction)
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

  // No path found - return direct path
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

  const NUDGE_DISTANCE = 20; // Minimum distance from shape boundaries

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

const CACHE_TTL = 5000; // 5 seconds cache lifetime
const MAX_CACHE_SIZE = 10; // Maximum number of cached graphs

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
function getCachedVisibilityGraph(shapes: Shape[]): OrthogonalVisibilityGraph {
  const key = getShapeCacheKey(shapes);
  const now = Date.now();

  // Check cache
  const cached = visibilityGraphCache.get(key);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.graph;
  }

  // Construct new graph
  const graph = constructVisibilityGraph(shapes);

  // Add to cache
  visibilityGraphCache.set(key, { graph, timestamp: now });

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
  bendPenalty: number = 50,
  refine: boolean = true,
  useCache: boolean = true
): Point[] {
  // Construct or get cached visibility graph
  const cachedGraph = useCache ? getCachedVisibilityGraph(shapes) : constructVisibilityGraph(shapes);

  // IMPORTANT: Clone the graph to avoid mutating the cached version
  const graph: OrthogonalVisibilityGraph = {
    nodes: new Map(cachedGraph.nodes),
    edges: new Map(Array.from(cachedGraph.edges.entries()).map(([k, v]) => [k, [...v]]))
  };

  // Find optimal route
  let route = findOptimalRoute(graph, start, end, startDir, endDir, shapes, bendPenalty);

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
  if (refine && route.length > 2) {
    route = refineRoute(route, shapes);
  }

  // Simplify by merging collinear segments
  route = simplifyRoute(route);

  return route;
}
