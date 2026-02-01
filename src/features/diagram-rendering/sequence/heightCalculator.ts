import type { Shape } from '@/entities/shape';
import type { Connector } from '@/entities/connector';
import {
  calculateConnectionPointCount,
  calculateLifelineHeight,
  HEIGHT_ADJUSTMENT_INCREMENT,
  MIN_CONNECTION_POINTS,
  SHRINK_THRESHOLD_POINTS,
} from './constants';

/**
 * Extracts the connection point index from a connection point ID
 * e.g., "e-5" -> 5, "w-12" -> 12
 */
function getConnectionPointIndex(connectionPointId: string | undefined): number {
  if (!connectionPointId) return -1;

  const match = connectionPointId.match(/^[ew]-(\d+)$/);
  if (!match) return -1;

  return parseInt(match[1], 10);
}

/**
 * Finds the highest connection point index used across all connectors
 * connected to sequence lifelines
 */
function findHighestUsedConnectionPoint(
  lifelineIds: Set<string>,
  connectors: Connector[]
): number {
  let highestIndex = -1;

  for (const connector of connectors) {
    // Only consider connectors connected to sequence lifelines
    if (!lifelineIds.has(connector.sourceShapeId) && !lifelineIds.has(connector.targetShapeId)) {
      continue;
    }

    const sourceIndex = getConnectionPointIndex(connector.sourceConnectionPoint);
    const targetIndex = getConnectionPointIndex(connector.targetConnectionPoint);

    highestIndex = Math.max(highestIndex, sourceIndex, targetIndex);
  }

  return highestIndex;
}

/**
 * Calculates the required height for all sequence lifelines in a diagram
 * based on message connector usage.
 *
 * Rules:
 * - If second-to-last visible connection point is used, grow by HEIGHT_ADJUSTMENT_INCREMENT
 * - If bottom SHRINK_THRESHOLD_POINTS are unused, shrink by HEIGHT_ADJUSTMENT_INCREMENT
 * - Never shrink below MIN_CONNECTION_POINTS
 * - All lifelines in diagram maintain synchronized height
 */
export function calculateRequiredLifelineHeight(
  shapes: Shape[],
  connectors: Connector[]
): number {
  // Find all sequence lifeline shapes
  const lifelines = shapes.filter(
    (shape) => shape.type === 'sequence-lifeline'
  );

  if (lifelines.length === 0) {
    return calculateLifelineHeight(MIN_CONNECTION_POINTS);
  }

  // Get current height from any lifeline (they should all be the same)
  const currentHeight = lifelines[0].height;
  const currentConnectionPoints = calculateConnectionPointCount(currentHeight);

  // Collect all lifeline IDs for filtering connectors
  const lifelineIds = new Set(lifelines.map((l) => l.id));

  // Find the highest connection point index being used
  const highestUsedIndex = findHighestUsedConnectionPoint(lifelineIds, connectors);

  // If no connection points are used, maintain current height (or minimum)
  if (highestUsedIndex === -1) {
    return Math.max(currentHeight, calculateLifelineHeight(MIN_CONNECTION_POINTS));
  }

  // Check if we need to grow
  // Second-to-last visible point has index: currentConnectionPoints - 2
  // (since points are 0-indexed: e-0, e-1, ..., e-(n-1))
  const secondToLastIndex = currentConnectionPoints - 2;

  if (highestUsedIndex >= secondToLastIndex) {
    // Grow by HEIGHT_ADJUSTMENT_INCREMENT connection points
    const newConnectionPoints = currentConnectionPoints + HEIGHT_ADJUSTMENT_INCREMENT;
    return calculateLifelineHeight(newConnectionPoints);
  }

  // Check if we need to shrink
  // Bottom SHRINK_THRESHOLD_POINTS have indices from:
  // (currentConnectionPoints - SHRINK_THRESHOLD_POINTS) to (currentConnectionPoints - 1)
  const shrinkThresholdIndex = currentConnectionPoints - SHRINK_THRESHOLD_POINTS;

  if (highestUsedIndex < shrinkThresholdIndex && currentConnectionPoints > MIN_CONNECTION_POINTS) {
    // Shrink by HEIGHT_ADJUSTMENT_INCREMENT connection points
    const newConnectionPoints = Math.max(
      MIN_CONNECTION_POINTS,
      currentConnectionPoints - HEIGHT_ADJUSTMENT_INCREMENT
    );
    return calculateLifelineHeight(newConnectionPoints);
  }

  // No change needed
  return currentHeight;
}
