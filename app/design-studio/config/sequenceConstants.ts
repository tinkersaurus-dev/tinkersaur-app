/**
 * Configuration constants for sequence diagram lifelines
 */

/**
 * Height of the participant box at the top of a lifeline
 */
export const PARTICIPANT_BOX_HEIGHT = 40;

/**
 * Vertical spacing between connection points on a lifeline
 */
export const CONNECTION_POINT_SPACING = 40;

/**
 * Y-offset from top of lifeline where first connection point appears
 */
export const FIRST_CONNECTION_POINT_Y = 80;

/**
 * Minimum number of connection points a lifeline should display
 */
export const MIN_CONNECTION_POINTS = 8;

/**
 * Number of connection points to add/remove when growing/shrinking lifelines
 */
export const HEIGHT_ADJUSTMENT_INCREMENT = 4;

/**
 * Number of empty connection points at bottom before triggering shrink
 */
export const SHRINK_THRESHOLD_POINTS = 6;

/**
 * Calculate lifeline height from number of connection points
 */
export function calculateLifelineHeight(connectionPoints: number): number {
  const lastPointY = FIRST_CONNECTION_POINT_Y + (connectionPoints - 1) * CONNECTION_POINT_SPACING;
  // Add some padding below the last connection point
  return lastPointY + CONNECTION_POINT_SPACING;
}

/**
 * Calculate number of connection points that fit in a given height
 */
export function calculateConnectionPointCount(height: number): number {
  const availableHeight = height - FIRST_CONNECTION_POINT_Y - CONNECTION_POINT_SPACING;
  return Math.floor(availableHeight / CONNECTION_POINT_SPACING) + 1;
}

/**
 * Default height for newly created lifelines (based on MIN_CONNECTION_POINTS)
 */
export const DEFAULT_LIFELINE_HEIGHT = calculateLifelineHeight(MIN_CONNECTION_POINTS);
