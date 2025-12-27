/**
 * Visibility Graph Builder for orthogonal connector routing
 *
 * Based on Wybrow, Marriott, and Stuckey (2009)
 * "Orthogonal Connector Routing" - Graph Drawing 2009
 */

import type { Shape, Point } from '~/core/entities/design-studio/types/Shape';
import type {
  Direction,
  ConnectionPoint,
  OrthogonalVisibilityGraph,
  VisibilityNode,
  VisibilityEdge,
  BboxBounds,
  Segment,
} from './types';
import { DESIGN_STUDIO_CONFIG } from './constants';
import {
  DirectionHelpers,
  manhattanDistance,
  nodeId,
  horizontalSegmentIntersectsShape,
  verticalSegmentIntersectsShape,
} from './geometry';

/**
 * Builds an orthogonal visibility graph from shapes and connection points
 */
export class VisibilityGraphBuilder {
  private shapes: Shape[];
  private connectionPoints: ConnectionPoint[];
  private nodes: Map<string, VisibilityNode> = new Map();
  private edges: Map<string, VisibilityEdge[]> = new Map();
  private nudgeDistance: number;
  private maxExtensionDistance: number;

  constructor(shapes: Shape[], connectionPoints?: ConnectionPoint[]) {
    this.shapes = shapes;
    this.connectionPoints = connectionPoints ?? [];
    this.nudgeDistance = DESIGN_STUDIO_CONFIG.routing.nudgeDistance;
    this.maxExtensionDistance = DESIGN_STUDIO_CONFIG.routing.maxGraphConnectionDistance;
  }

  /**
   * Build the visibility graph
   */
  build(): OrthogonalVisibilityGraph {
    // Get all interesting points (offset from shape boundaries)
    const shapeCornerPointsWithOffset = this.getShapeCornerPointsWithOffset();

    // Generate horizontal and vertical segments
    const horizontalSegments = this.generateHorizontalSegments(shapeCornerPointsWithOffset);
    const verticalSegments = this.generateVerticalSegments(shapeCornerPointsWithOffset);

    // Add all interesting points as nodes
    for (const point of shapeCornerPointsWithOffset) {
      const id = nodeId(point.x, point.y);
      if (!this.nodes.has(id)) {
        this.nodes.set(id, { x: point.x, y: point.y, id });
        this.edges.set(id, []);
      }
    }

    // Create nodes at intersections of horizontal and vertical segments
    this.createSegmentIntersectionNodes(horizontalSegments, verticalSegments);

    // Create bounding box around shapes with connection points
    const bboxBounds = this.createBoundingBox();

    // Extend visibility from connection points and create ray intersection nodes
    if (this.connectionPoints.length > 0) {
      const visibilityRays = this.collectVisibilityRays(
        shapeCornerPointsWithOffset,
        bboxBounds
      );
      this.createRayIntersectionNodes(visibilityRays);

      // Extend visibility from connection points
      for (const connectionPoint of this.connectionPoints) {
        this.extendVisibilityFromConnectionPoint(
          connectionPoint,
          horizontalSegments,
          verticalSegments,
          bboxBounds
        );
      }
    }

    // Create base grid edges between all nodes
    this.createBaseGridEdges();

    return { nodes: this.nodes, edges: this.edges };
  }

  /**
   * Get all interesting points from shapes with offset
   */
  private getShapeCornerPointsWithOffset(): Point[] {
    const points: Point[] = [];

    if (this.connectionPoints.length === 0) {
      return points;
    }

    // Identify which shapes have connection points
    const shapesWithConnections = this.getShapesWithConnections();

    // Only create corner points for shapes that have connection points
    for (const shape of shapesWithConnections) {
      // Top-left corner (NW)
      points.push({ x: shape.x - this.nudgeDistance, y: shape.y - this.nudgeDistance });
      // Top-right corner (NE)
      points.push({
        x: shape.x + shape.width + this.nudgeDistance,
        y: shape.y - this.nudgeDistance,
      });
      // Bottom-left corner (SW)
      points.push({
        x: shape.x - this.nudgeDistance,
        y: shape.y + shape.height + this.nudgeDistance,
      });
      // Bottom-right corner (SE)
      points.push({
        x: shape.x + shape.width + this.nudgeDistance,
        y: shape.y + shape.height + this.nudgeDistance,
      });
    }

    return points;
  }

  /**
   * Get shapes that have connection points on their boundaries
   */
  private getShapesWithConnections(): Set<Shape> {
    const shapesWithConnections = new Set<Shape>();

    for (const cp of this.connectionPoints) {
      for (const shape of this.shapes) {
        const onTop =
          Math.abs(cp.y - shape.y) < 1 && cp.x >= shape.x && cp.x <= shape.x + shape.width;
        const onBottom =
          Math.abs(cp.y - (shape.y + shape.height)) < 1 &&
          cp.x >= shape.x &&
          cp.x <= shape.x + shape.width;
        const onLeft =
          Math.abs(cp.x - shape.x) < 1 && cp.y >= shape.y && cp.y <= shape.y + shape.height;
        const onRight =
          Math.abs(cp.x - (shape.x + shape.width)) < 1 &&
          cp.y >= shape.y &&
          cp.y <= shape.y + shape.height;

        if (onTop || onBottom || onLeft || onRight) {
          shapesWithConnections.add(shape);
        }
      }
    }

    return shapesWithConnections;
  }

  /**
   * Generate all interesting horizontal segments
   */
  private generateHorizontalSegments(shapeCornerPointsWithOffset: Point[]): Segment[] {
    const segments: Segment[] = [];

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
      const sortedPoints = [...points].sort((a, b) => a.x - b.x);

      for (let i = 0; i < sortedPoints.length - 1; i++) {
        const p1 = sortedPoints[i];
        const p2 = sortedPoints[i + 1];

        let blocked = false;
        for (const shape of this.shapes) {
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
   */
  private generateVerticalSegments(interestingPoints: Point[]): Segment[] {
    const segments: Segment[] = [];

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
      const sortedPoints = [...points].sort((a, b) => a.y - b.y);

      for (let i = 0; i < sortedPoints.length - 1; i++) {
        const p1 = sortedPoints[i];
        const p2 = sortedPoints[i + 1];

        let blocked = false;
        for (const shape of this.shapes) {
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
   * Create nodes at intersections of horizontal and vertical segments
   */
  private createSegmentIntersectionNodes(
    horizontalSegments: Segment[],
    verticalSegments: Segment[]
  ): void {
    for (const hSeg of horizontalSegments) {
      for (const vSeg of verticalSegments) {
        const hY = hSeg.from.y;
        const vX = vSeg.from.x;
        const hMinX = Math.min(hSeg.from.x, hSeg.to.x);
        const hMaxX = Math.max(hSeg.from.x, hSeg.to.x);
        const vMinY = Math.min(vSeg.from.y, vSeg.to.y);
        const vMaxY = Math.max(vSeg.from.y, vSeg.to.y);

        if (vX >= hMinX && vX <= hMaxX && hY >= vMinY && hY <= vMaxY) {
          const id = nodeId(vX, hY);
          if (!this.nodes.has(id)) {
            this.nodes.set(id, { x: vX, y: hY, id });
            this.edges.set(id, []);
          }
        }
      }
    }
  }

  /**
   * Create bounding box around shapes with connection points
   */
  private createBoundingBox(): BboxBounds | undefined {
    if (this.connectionPoints.length === 0) {
      return undefined;
    }

    const shapesWithConnections = this.getShapesWithConnections();
    if (shapesWithConnections.size === 0) {
      return undefined;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const shape of shapesWithConnections) {
      minX = Math.min(minX, shape.x - this.nudgeDistance);
      minY = Math.min(minY, shape.y - this.nudgeDistance);
      maxX = Math.max(maxX, shape.x + shape.width + this.nudgeDistance);
      maxY = Math.max(maxY, shape.y + shape.height + this.nudgeDistance);
    }

    // Expand bounding box by nudge distance
    minX -= this.nudgeDistance;
    minY -= this.nudgeDistance;
    maxX += this.nudgeDistance;
    maxY += this.nudgeDistance;

    const bboxBounds: BboxBounds = { minX, minY, maxX, maxY };

    // Create nodes at the four corners of the bounding box
    const bboxCorners = [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: minX, y: maxY },
      { x: maxX, y: maxY },
    ];

    for (const corner of bboxCorners) {
      const id = nodeId(corner.x, corner.y);
      if (!this.nodes.has(id)) {
        this.nodes.set(id, { x: corner.x, y: corner.y, id });
        this.edges.set(id, []);
      }
    }

    // Create nodes along edges at connection point and offset corner coordinates
    this.createBoundaryNodes(bboxBounds, shapesWithConnections);

    return bboxBounds;
  }

  /**
   * Create nodes along bounding box edges
   */
  private createBoundaryNodes(bboxBounds: BboxBounds, shapesWithConnections: Set<Shape>): void {
    const { minX, minY, maxX, maxY } = bboxBounds;
    const boundaryCoords = new Set<number>();

    // Collect all X coordinates
    for (const cp of this.connectionPoints) {
      boundaryCoords.add(cp.x);
    }
    for (const shape of shapesWithConnections) {
      boundaryCoords.add(shape.x - this.nudgeDistance);
      boundaryCoords.add(shape.x + shape.width + this.nudgeDistance);
    }

    // Create nodes on top and bottom edges
    for (const x of boundaryCoords) {
      if (x > minX && x < maxX) {
        const topId = nodeId(x, minY);
        if (!this.nodes.has(topId)) {
          this.nodes.set(topId, { x, y: minY, id: topId });
          this.edges.set(topId, []);
        }
        const bottomId = nodeId(x, maxY);
        if (!this.nodes.has(bottomId)) {
          this.nodes.set(bottomId, { x, y: maxY, id: bottomId });
          this.edges.set(bottomId, []);
        }
      }
    }

    // Collect all Y coordinates
    boundaryCoords.clear();
    for (const cp of this.connectionPoints) {
      boundaryCoords.add(cp.y);
    }
    for (const shape of shapesWithConnections) {
      boundaryCoords.add(shape.y - this.nudgeDistance);
      boundaryCoords.add(shape.y + shape.height + this.nudgeDistance);
    }

    // Create nodes on left and right edges
    for (const y of boundaryCoords) {
      if (y > minY && y < maxY) {
        const leftId = nodeId(minX, y);
        if (!this.nodes.has(leftId)) {
          this.nodes.set(leftId, { x: minX, y, id: leftId });
          this.edges.set(leftId, []);
        }
        const rightId = nodeId(maxX, y);
        if (!this.nodes.has(rightId)) {
          this.nodes.set(rightId, { x: maxX, y, id: rightId });
          this.edges.set(rightId, []);
        }
      }
    }
  }

  /**
   * Collect visibility rays from connection points and offset corners
   */
  private collectVisibilityRays(
    shapeCornerPointsWithOffset: Point[],
    bboxBounds: BboxBounds | undefined
  ): Array<{
    start: Point;
    end: Point;
    direction: Direction;
    isHorizontal: boolean;
  }> {
    const visibilityRays: Array<{
      start: Point;
      end: Point;
      direction: Direction;
      isHorizontal: boolean;
    }> = [];

    // Collect rays from connection points
    for (const connectionPoint of this.connectionPoints) {
      const { x, y, direction } = connectionPoint;
      const endpoint = this.calculateRayEndpoint(x, y, direction, bboxBounds);

      visibilityRays.push({
        start: { x, y },
        end: endpoint,
        direction,
        isHorizontal: direction === 'E' || direction === 'W',
      });
    }

    // Collect rays from offset corner points in all 4 directions
    for (const point of shapeCornerPointsWithOffset) {
      for (const dir of ['N', 'S', 'E', 'W'] as Direction[]) {
        const endpoint = this.calculateRayEndpoint(point.x, point.y, dir, bboxBounds);

        // Only add the ray if it extends beyond the starting point
        if (
          (dir === 'N' && endpoint.y < point.y) ||
          (dir === 'S' && endpoint.y > point.y) ||
          (dir === 'E' && endpoint.x > point.x) ||
          (dir === 'W' && endpoint.x < point.x)
        ) {
          visibilityRays.push({
            start: { x: point.x, y: point.y },
            end: endpoint,
            direction: dir,
            isHorizontal: dir === 'E' || dir === 'W',
          });
        }
      }
    }

    return visibilityRays;
  }

  /**
   * Calculate ray endpoint for a given point and direction
   */
  private calculateRayEndpoint(
    x: number,
    y: number,
    direction: Direction,
    bboxBounds: BboxBounds | undefined
  ): Point {
    let maxExtension = Infinity;

    for (const shape of this.shapes) {
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

    if (maxExtension === Infinity) {
      maxExtension = this.maxExtensionDistance;
    }

    let endX = x,
      endY = y;
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
  }

  /**
   * Create nodes at ray intersections
   */
  private createRayIntersectionNodes(
    visibilityRays: Array<{
      start: Point;
      end: Point;
      direction: Direction;
      isHorizontal: boolean;
    }>
  ): void {
    const rayIntersections: Array<{ x: number; y: number }> = [];

    for (const ray1 of visibilityRays) {
      for (const ray2 of visibilityRays) {
        if (ray1 === ray2) continue;

        if (ray1.isHorizontal && !ray2.isHorizontal) {
          const hY = ray1.start.y;
          const hMinX = Math.min(ray1.start.x, ray1.end.x);
          const hMaxX = Math.max(ray1.start.x, ray1.end.x);

          const vX = ray2.start.x;
          const vMinY = Math.min(ray2.start.y, ray2.end.y);
          const vMaxY = Math.max(ray2.start.y, ray2.end.y);

          if (vX >= hMinX && vX <= hMaxX && hY >= vMinY && hY <= vMaxY) {
            rayIntersections.push({ x: vX, y: hY });
          }
        }
      }
    }

    for (const intersection of rayIntersections) {
      const id = nodeId(intersection.x, intersection.y);
      if (!this.nodes.has(id)) {
        this.nodes.set(id, { x: intersection.x, y: intersection.y, id });
        this.edges.set(id, []);
      }
    }
  }

  /**
   * Extend visibility from a connection point in its port direction
   */
  private extendVisibilityFromConnectionPoint(
    connectionPoint: ConnectionPoint,
    horizontalSegments: Segment[],
    verticalSegments: Segment[],
    bboxBounds: BboxBounds | undefined
  ): void {
    const { x, y, direction } = connectionPoint;

    // Add the connection point itself as a node
    const connectionPointId = nodeId(x, y);
    if (!this.nodes.has(connectionPointId)) {
      this.nodes.set(connectionPointId, { x, y, id: connectionPointId });
      this.edges.set(connectionPointId, []);
    }

    // Find the maximum extension distance before hitting a shape
    let maxExtension = Infinity;

    for (const shape of this.shapes) {
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

    if (maxExtension === Infinity) {
      maxExtension = this.maxExtensionDistance;
    }

    // Find all intersections with existing visibility segments AND existing nodes
    const intersections = this.findIntersections(
      x,
      y,
      direction,
      maxExtension,
      horizontalSegments,
      verticalSegments,
      bboxBounds
    );

    // Create nodes and edges for each intersection
    let previousNodeId = connectionPointId;
    let previousPoint = { x, y };

    for (const intersection of intersections) {
      const intersectionId = nodeId(intersection.x, intersection.y);

      if (!this.nodes.has(intersectionId)) {
        this.nodes.set(intersectionId, {
          x: intersection.x,
          y: intersection.y,
          id: intersectionId,
        });
        this.edges.set(intersectionId, []);
      }

      // Create edge from previous node to this intersection
      const edgeLength = manhattanDistance(previousPoint, intersection);
      this.edges.get(previousNodeId)!.push({
        from: previousNodeId,
        to: intersectionId,
        direction: direction,
        length: edgeLength,
      });

      // Create reverse edge for bidirectional routing
      const reverseDir = DirectionHelpers.reverse(direction);
      this.edges.get(intersectionId)!.push({
        from: intersectionId,
        to: previousNodeId,
        direction: reverseDir,
        length: edgeLength,
      });

      previousNodeId = intersectionId;
      previousPoint = intersection;
    }

    // Fallback: connect to nearest orthogonally aligned grid nodes
    if (intersections.length === 0) {
      this.createFallbackConnections(connectionPointId, x, y);
    }
  }

  /**
   * Find intersections along a ray
   */
  private findIntersections(
    x: number,
    y: number,
    direction: Direction,
    maxExtension: number,
    horizontalSegments: Segment[],
    verticalSegments: Segment[],
    bboxBounds: BboxBounds | undefined
  ): Array<{ x: number; y: number; distance: number }> {
    const intersections: Array<{ x: number; y: number; distance: number }> = [];

    if (direction === 'N' || direction === 'S') {
      // Vertical extension - find intersections with horizontal segments
      for (const seg of horizontalSegments) {
        if (seg.from.y === seg.to.y) {
          const segY = seg.from.y;
          const segMinX = Math.min(seg.from.x, seg.to.x);
          const segMaxX = Math.max(seg.from.x, seg.to.x);

          if (x >= segMinX && x <= segMaxX) {
            const distance = Math.abs(segY - y);
            if (distance > 0 && distance <= maxExtension) {
              if ((direction === 'N' && segY < y) || (direction === 'S' && segY > y)) {
                intersections.push({ x, y: segY, distance });
              }
            }
          }
        }
      }

      // Also find nodes that lie on the same vertical line
      for (const [, node] of this.nodes) {
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
          const distance = y - bboxBounds.minY;
          if (distance > 0 && distance <= maxExtension) {
            intersections.push({ x, y: bboxBounds.minY, distance });
          }
        } else if (direction === 'S' && bboxBounds.maxY > y) {
          const distance = bboxBounds.maxY - y;
          if (distance > 0 && distance <= maxExtension) {
            intersections.push({ x, y: bboxBounds.maxY, distance });
          }
        }
      }
    } else {
      // Horizontal extension - find intersections with vertical segments
      for (const seg of verticalSegments) {
        if (seg.from.x === seg.to.x) {
          const segX = seg.from.x;
          const segMinY = Math.min(seg.from.y, seg.to.y);
          const segMaxY = Math.max(seg.from.y, seg.to.y);

          if (y >= segMinY && y <= segMaxY) {
            const distance = Math.abs(segX - x);
            if (distance > 0 && distance <= maxExtension) {
              if ((direction === 'W' && segX < x) || (direction === 'E' && segX > x)) {
                intersections.push({ x: segX, y, distance });
              }
            }
          }
        }
      }

      // Also find nodes that lie on the same horizontal line
      for (const [, node] of this.nodes) {
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
          const distance = x - bboxBounds.minX;
          if (distance > 0 && distance <= maxExtension) {
            intersections.push({ x: bboxBounds.minX, y, distance });
          }
        } else if (direction === 'E' && bboxBounds.maxX > x) {
          const distance = bboxBounds.maxX - x;
          if (distance > 0 && distance <= maxExtension) {
            intersections.push({ x: bboxBounds.maxX, y, distance });
          }
        }
      }
    }

    // Sort by distance and remove duplicates
    intersections.sort((a, b) => a.distance - b.distance);
    const uniqueIntersections: Array<{ x: number; y: number; distance: number }> = [];
    for (const intersection of intersections) {
      const isDuplicate = uniqueIntersections.some(
        (ui) => ui.x === intersection.x && ui.y === intersection.y
      );
      if (!isDuplicate) {
        uniqueIntersections.push(intersection);
      }
    }

    return uniqueIntersections;
  }

  /**
   * Create fallback connections to nearest orthogonally aligned nodes
   */
  private createFallbackConnections(connectionPointId: string, x: number, y: number): void {
    const nearestNodes: Array<{
      node: VisibilityNode;
      distance: number;
      direction: Direction;
    }> = [];

    for (const [, node] of this.nodes) {
      if (node.id === connectionPointId) continue;

      const dist = manhattanDistance({ x, y }, node);
      if (dist > 0 && dist <= this.maxExtensionDistance) {
        let dir: Direction | null = null;

        if (node.x === x && node.y !== y) {
          dir = node.y > y ? 'S' : 'N';
        } else if (node.y === y && node.x !== x) {
          dir = node.x > x ? 'E' : 'W';
        }

        if (dir !== null) {
          nearestNodes.push({ node, distance: dist, direction: dir });
        }
      }
    }

    nearestNodes.sort((a, b) => a.distance - b.distance);
    const closestNodes = nearestNodes.slice(0, 4);

    for (const { node, distance, direction: edgeDir } of closestNodes) {
      let blocked = false;
      if (edgeDir === 'N' || edgeDir === 'S') {
        for (const shape of this.shapes) {
          if (verticalSegmentIntersectsShape(x, Math.min(y, node.y), Math.max(y, node.y), shape)) {
            blocked = true;
            break;
          }
        }
      } else {
        for (const shape of this.shapes) {
          if (horizontalSegmentIntersectsShape(Math.min(x, node.x), Math.max(x, node.x), y, shape)) {
            blocked = true;
            break;
          }
        }
      }

      if (!blocked) {
        this.edges.get(connectionPointId)!.push({
          from: connectionPointId,
          to: node.id,
          direction: edgeDir,
          length: distance,
        });

        const reverseDir = DirectionHelpers.reverse(edgeDir);
        this.edges.get(node.id)!.push({
          from: node.id,
          to: connectionPointId,
          direction: reverseDir,
          length: distance,
        });
      }
    }
  }

  /**
   * Create base grid edges between all nodes
   */
  private createBaseGridEdges(): void {
    const nodeList = Array.from(this.nodes.values());

    for (const node of nodeList) {
      const nodeEdges = this.edges.get(node.id)!;

      // Find nearest neighbor in each cardinal direction
      this.addNearestNeighborEdge(node, nodeList, nodeEdges, 'N');
      this.addNearestNeighborEdge(node, nodeList, nodeEdges, 'S');
      this.addNearestNeighborEdge(node, nodeList, nodeEdges, 'E');
      this.addNearestNeighborEdge(node, nodeList, nodeEdges, 'W');
    }
  }

  /**
   * Add edge to nearest neighbor in given direction
   */
  private addNearestNeighborEdge(
    node: VisibilityNode,
    nodeList: VisibilityNode[],
    nodeEdges: VisibilityEdge[],
    direction: Direction
  ): void {
    let nearest: VisibilityNode | null = null;
    let nearestDist = Infinity;

    for (const other of nodeList) {
      let isInDirection = false;
      let dist = 0;

      switch (direction) {
        case 'N':
          if (other.x === node.x && other.y > node.y) {
            isInDirection = true;
            dist = other.y - node.y;
          }
          break;
        case 'S':
          if (other.x === node.x && other.y < node.y) {
            isInDirection = true;
            dist = node.y - other.y;
          }
          break;
        case 'E':
          if (other.y === node.y && other.x > node.x) {
            isInDirection = true;
            dist = other.x - node.x;
          }
          break;
        case 'W':
          if (other.y === node.y && other.x < node.x) {
            isInDirection = true;
            dist = node.x - other.x;
          }
          break;
      }

      if (isInDirection && dist < nearestDist) {
        // Check if path is clear
        let blocked = false;
        if (direction === 'N' || direction === 'S') {
          for (const shape of this.shapes) {
            if (verticalSegmentIntersectsShape(node.x, node.y, other.y, shape)) {
              blocked = true;
              break;
            }
          }
        } else {
          for (const shape of this.shapes) {
            if (horizontalSegmentIntersectsShape(node.x, other.x, node.y, shape)) {
              blocked = true;
              break;
            }
          }
        }

        if (!blocked) {
          nearest = other;
          nearestDist = dist;
        }
      }
    }

    if (nearest) {
      nodeEdges.push({
        from: node.id,
        to: nearest.id,
        direction,
        length: nearestDist,
      });
    }
  }
}
