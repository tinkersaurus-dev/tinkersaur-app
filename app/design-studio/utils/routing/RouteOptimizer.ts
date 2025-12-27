/**
 * Route optimization utilities for orthogonal connector routing
 */

import type { Shape, Point } from '~/core/entities/design-studio/types/Shape';
import { DESIGN_STUDIO_CONFIG } from './constants';

/**
 * Refine route by nudging segments away from shape boundaries
 * This implements the "nudging" stage from Wybrow et al.
 * - Adds spacing from shape edges for better visual appearance
 * - Centers segments in available space between obstacles
 *
 * NOTE: Currently disabled in the main routing function because we build
 * the nudge offset directly into the visibility graph construction.
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
        for (const shape of shapes) {
          if (shape.x <= segMaxX && shape.x + shape.width >= segMinX) {
            const distToTop = Math.abs(currPoint.y - (shape.y + shape.height));
            if (distToTop === minDistToShape) {
              nudgedY = shape.y + shape.height + NUDGE_DISTANCE;
              break;
            }
          }
        }
      } else if (closestShapeEdge === 'bottom') {
        for (const shape of shapes) {
          if (shape.x <= segMaxX && shape.x + shape.width >= segMinX) {
            const distToBottom = Math.abs(currPoint.y - shape.y);
            if (distToBottom === minDistToShape) {
              nudgedY = shape.y - NUDGE_DISTANCE;
              break;
            }
          }
        }
      }

      // Add point with nudged Y coordinate
      if (nudgedY !== prevPoint.y) {
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
        for (const shape of shapes) {
          if (shape.y <= segMaxY && shape.y + shape.height >= segMinY) {
            const distToRight = Math.abs(currPoint.x - (shape.x + shape.width));
            if (distToRight === minDistToShape) {
              nudgedX = shape.x + shape.width + NUDGE_DISTANCE;
              break;
            }
          }
        }
      } else if (closestShapeEdge === 'left') {
        for (const shape of shapes) {
          if (shape.y <= segMaxY && shape.y + shape.height >= segMinY) {
            const distToLeft = Math.abs(currPoint.x - shape.x);
            if (distToLeft === minDistToShape) {
              nudgedX = shape.x - NUDGE_DISTANCE;
              break;
            }
          }
        }
      }

      // Add point with nudged X coordinate
      if (nudgedX !== prevPoint.x) {
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
      (prev.y === curr.y && curr.y === next.y); // Horizontal line

    if (!isCollinear) {
      simplified.push(curr);
    }
  }

  simplified.push(route[route.length - 1]);

  return simplified;
}
