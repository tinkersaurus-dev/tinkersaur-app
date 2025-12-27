/**
 * Label Positioning Utilities
 *
 * Utilities for calculating label positions on connectors.
 */

export type TextAnchor = 'start' | 'middle' | 'end';

export interface LabelPosition {
  x: number;
  y: number;
  textAnchor: TextAnchor;
}

/**
 * Calculate position for cardinality label near a connector endpoint.
 *
 * @param point - The endpoint coordinates
 * @param direction - The direction from the endpoint (N, S, E, W)
 * @param offset - Distance from endpoint (in pixels, zoom-compensated)
 * @returns Position for the label with appropriate text anchor
 */
export function calculateCardinalityLabelPosition(
  point: { x: number; y: number },
  direction: string,
  offset: number
): LabelPosition {
  let x = point.x;
  let y = point.y;
  let textAnchor: TextAnchor = 'middle';

  switch (direction) {
    case 'N': // North - offset upward
      y -= offset;
      break;
    case 'S': // South - offset downward
      y += offset;
      break;
    case 'E': // East - offset to the right
      x += offset;
      textAnchor = 'start';
      break;
    case 'W': // West - offset to the left
      x -= offset;
      textAnchor = 'end';
      break;
  }

  return { x, y, textAnchor };
}
