/**
 * Orthogonal Connector Routing Module
 *
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

import type { Shape, Point } from '~/core/entities/design-studio/types/Shape';
import type { ConnectionPoint, OrthogonalVisibilityGraph, VisitedNode } from './types';
import type { Direction } from './types';

import { VisibilityGraphBuilder } from './VisibilityGraphBuilder';
import { OrthogonalPathfinder } from './OrthogonalPathfinder';
import { simplifyRoute } from './RouteOptimizer';
import { RouteCache } from './RouteCache';

// Re-export types
export type {
  Direction,
  VisibilityNode,
  VisibilityEdge,
  OrthogonalVisibilityGraph,
  RouteSegment,
  ConnectionPoint,
  VisitedNode,
} from './types';

// Re-export utilities
export { DirectionHelpers, manhattanDistance } from './geometry';

// Re-export classes
export { VisibilityGraphBuilder } from './VisibilityGraphBuilder';
export { OrthogonalPathfinder } from './OrthogonalPathfinder';
export { RouteCache } from './RouteCache';

// Re-export functions
export { refineRoute, simplifyRoute } from './RouteOptimizer';

// Module-level cache instance
const routeCache = new RouteCache();

// Module-level pathfinder for debug access
let lastPathfinder: OrthogonalPathfinder | null = null;

/**
 * Get the nodes visited during the last search (for debugging)
 */
export function getLastVisitedNodes(): VisitedNode[] {
  return lastPathfinder?.getVisitedNodes() ?? [];
}

/**
 * Clear the visibility graph cache
 */
export function clearVisibilityGraphCache(): void {
  routeCache.clear();
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
  connectionPoints?: ConnectionPoint[]
): Point[] {
  // Build visibility graph
  const builder = new VisibilityGraphBuilder(shapes, connectionPoints);
  const graph = builder.build();

  // Find optimal route
  const pathfinder = new OrthogonalPathfinder();
  lastPathfinder = pathfinder;
  let route = pathfinder.findRoute(graph, start, end, startDir, endDir, shapes);

  // Debug: Send graph data to debug overlay
  sendDebugData(graph, start, end, route, pathfinder.getVisitedNodes());

  // Simplify by merging collinear segments
  route = simplifyRoute(route);

  return route;
}

/**
 * Send debug data to the debug overlay (if available)
 */
function sendDebugData(
  graph: OrthogonalVisibilityGraph,
  start: Point,
  end: Point,
  route: Point[],
  visitedNodes: VisitedNode[]
): void {
  if (typeof window !== 'undefined') {
    try {
      const setDebugGraph = (
        window as Window & {
          setRoutingDebugGraph?: (
            graph: OrthogonalVisibilityGraph,
            start: Point,
            end: Point,
            route: Point[],
            visitedNodes: VisitedNode[]
          ) => void;
        }
      ).setRoutingDebugGraph;
      if (setDebugGraph) {
        setDebugGraph(graph, start, end, route, visitedNodes);
      }
    } catch (_e) {
      // Ignore - debug overlay not available
    }
  }
}
