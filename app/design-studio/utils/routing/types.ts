/**
 * Type definitions for orthogonal connector routing
 */

import type { Point } from '~/core/entities/design-studio/types/Shape';

/** Cardinal directions for routing */
export type Direction = 'N' | 'S' | 'E' | 'W';

/** Node in the orthogonal visibility graph */
export interface VisibilityNode {
  x: number;
  y: number;
  id: string; // Unique identifier: "x,y"
}

/** Edge in the orthogonal visibility graph */
export interface VisibilityEdge {
  from: string; // node id
  to: string; // node id
  direction: Direction;
  length: number;
}

/** Orthogonal visibility graph structure */
export interface OrthogonalVisibilityGraph {
  nodes: Map<string, VisibilityNode>;
  edges: Map<string, VisibilityEdge[]>; // Adjacency list: nodeId -> edges
}

/** Route segment with direction information */
export interface RouteSegment {
  from: Point;
  to: Point;
  direction: Direction;
}

/** A* search state (internal to pathfinder) */
export interface SearchState {
  nodeId: string;
  entryDirection: Direction;
  pathLength: number;
  bendCount: number;
  cost: number;
  parent: SearchState | null;
}

/** Connection point with position and direction */
export interface ConnectionPoint {
  x: number;
  y: number;
  direction: Direction;
}

/** Bounding box bounds */
export interface BboxBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Segment between two points */
export interface Segment {
  from: Point;
  to: Point;
}

/** Visited node for debugging */
export interface VisitedNode {
  x: number;
  y: number;
  order: number;
}
