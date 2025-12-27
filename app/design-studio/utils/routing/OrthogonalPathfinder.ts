/**
 * A* Pathfinder for orthogonal connector routing
 *
 * Based on Wybrow, Marriott, and Stuckey (2009)
 * "Orthogonal Connector Routing" - Graph Drawing 2009
 */

import type { Shape, Point } from '~/core/entities/design-studio/types/Shape';
import type {
  Direction,
  OrthogonalVisibilityGraph,
  SearchState,
  VisitedNode,
} from './types';
import { ROUTING_CONSTANTS } from './constants';
import { DirectionHelpers, manhattanDistance, nodeId } from './geometry';

/**
 * A* pathfinder for finding optimal orthogonal routes
 */
export class OrthogonalPathfinder {
  private visitedNodes: VisitedNode[] = [];

  /**
   * Find optimal route through visibility graph using A* search
   *
   * Cost function: combines path length and bend count
   * State: (node, entry_direction)
   */
  findRoute(
    graph: OrthogonalVisibilityGraph,
    start: Point,
    end: Point,
    startDir: Direction,
    endDir: Direction,
    _shapes: Shape[]
  ): Point[] {
    this.visitedNodes = [];

    const startId = nodeId(start.x, start.y);
    const endId = nodeId(end.x, end.y);

    // Verify start and end nodes exist in graph
    if (!graph.nodes.has(startId)) {
      return [start, end];
    }
    if (!graph.nodes.has(endId)) {
      return [start, end];
    }

    // Check for zero edges
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
      parent: null,
    };
    openSet.push(initialState);

    // Track visited nodes for debugging
    let visitOrder = 0;

    // A* search
    let iterations = 0;
    while (openSet.length > 0 && iterations < ROUTING_CONSTANTS.MAX_ASTAR_ITERATIONS) {
      iterations++;

      // Get state with lowest cost
      openSet.sort((a, b) => a.cost - b.cost);
      const current = openSet.shift()!;

      const currentKey = current.nodeId;
      if (closedSet.has(currentKey)) continue;
      closedSet.add(currentKey);

      // Track this visit for debugging
      const currentNodePos = graph.nodes.get(current.nodeId);
      if (currentNodePos) {
        this.visitedNodes.push({
          x: currentNodePos.x,
          y: currentNodePos.y,
          order: visitOrder++,
        });
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

        return path;
      }

      // Expand neighbors
      const nodeEdges = graph.edges.get(current.nodeId) || [];

      for (const edge of nodeEdges) {
        const neighbor = graph.nodes.get(edge.to);
        if (!neighbor) {
          continue;
        }
        const neighborKey = edge.to;

        if (closedSet.has(neighborKey)) continue;

        // Calculate cost
        const newLength = current.pathLength + edge.length;
        const newBends =
          current.bendCount + (edge.direction === current.entryDirection ? 0 : 1);
        const estimatedRemaining = this.estimateRemainingSegments(
          { x: neighbor.x, y: neighbor.y },
          edge.direction,
          end,
          endDir
        );
        const estimatedRemainingLength = manhattanDistance(
          { x: neighbor.x, y: neighbor.y },
          end
        );
        const newCost =
          newLength +
          newBends * ROUTING_CONSTANTS.BEND_COST_WEIGHT +
          estimatedRemainingLength +
          estimatedRemaining * ROUTING_CONSTANTS.ESTIMATED_SEGMENTS_WEIGHT;

        // Add to open set
        const newState: SearchState = {
          nodeId: edge.to,
          entryDirection: edge.direction,
          pathLength: newLength,
          bendCount: newBends,
          cost: newCost,
          parent: current,
        };

        // Check if we already have this node in open set
        const existingIndex = openSet.findIndex((s) => s.nodeId === edge.to);
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

    return [start, end];
  }

  /**
   * Get the nodes visited during the last search (for debugging)
   */
  getVisitedNodes(): VisitedNode[] {
    return this.visitedNodes;
  }

  /**
   * Estimate remaining segments needed to reach destination
   * Based on Figure 2(a) from the paper
   */
  private estimateRemainingSegments(
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
    if (
      (DirectionHelpers.left(destDir) === currentDir ||
        DirectionHelpers.right(destDir) === currentDir) &&
      dirs.has(currentDir)
    ) {
      return 1;
    }

    // Case 2: Same direction as destination or opposite but not aligned
    if (
      (currentDir === destDir && (dirs.size !== 1 || !dirs.has(currentDir))) ||
      (currentDir === DirectionHelpers.reverse(destDir) &&
        (dirs.size !== 1 || !dirs.has(destDir)))
    ) {
      return 2;
    }

    // Case 3: Perpendicular but not moving toward destination
    if (
      (DirectionHelpers.left(destDir) === currentDir ||
        DirectionHelpers.right(destDir) === currentDir) &&
      !dirs.has(currentDir)
    ) {
      return 3;
    }

    // Case 4: Opposite direction
    if (
      (currentDir === DirectionHelpers.reverse(destDir) &&
        dirs.size === 1 &&
        dirs.has(destDir)) ||
      (currentDir === destDir && !dirs.has(currentDir))
    ) {
      return 4;
    }

    return 3; // Default estimate
  }
}
