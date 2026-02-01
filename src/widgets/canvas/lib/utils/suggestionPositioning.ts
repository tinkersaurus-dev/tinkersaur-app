/**
 * Smart positioning utility for suggestion comment shapes
 *
 * Calculates optimal positions for suggestion shapes that:
 * 1. Default to 50px above the target shape
 * 2. Avoid overlapping with existing shapes
 * 3. Stack multiple suggestions for the same target vertically
 */

import type { Shape } from '@/entities/shape';

// Default suggestion shape dimensions
export const SUGGESTION_SHAPE_WIDTH = 200;
export const SUGGESTION_SHAPE_HEIGHT = 60;
export const SUGGESTION_GAP = 50; // Gap between target shape and suggestion
export const SUGGESTION_STACK_GAP = 10; // Gap between stacked suggestions

interface Position {
  x: number;
  y: number;
}

interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Check if two bounding boxes overlap
 */
function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

/**
 * Get bounding box for a shape
 */
function getShapeBounds(shape: Shape): Bounds {
  return {
    left: shape.x,
    top: shape.y,
    right: shape.x + shape.width,
    bottom: shape.y + shape.height,
  };
}

/**
 * Get bounding box for a proposed position
 */
function getPositionBounds(position: Position, width: number, height: number): Bounds {
  return {
    left: position.x,
    top: position.y,
    right: position.x + width,
    bottom: position.y + height,
  };
}

/**
 * Check if a position would overlap with any existing shapes
 */
function positionOverlapsShapes(
  position: Position,
  width: number,
  height: number,
  existingShapes: Shape[]
): boolean {
  const proposedBounds = getPositionBounds(position, width, height);

  for (const shape of existingShapes) {
    // Skip shapes that are also suggestions (we handle stacking separately)
    if (shape.overlayTag === 'suggestion') continue;

    const shapeBounds = getShapeBounds(shape);
    if (boundsOverlap(proposedBounds, shapeBounds)) {
      return true;
    }
  }

  return false;
}

/**
 * Find the best position for a suggestion shape relative to its target
 *
 * Tries positions in order: above, right, left, below
 * Returns the first position that doesn't overlap existing shapes
 */
export function findSuggestionPosition(
  targetShape: Shape,
  existingShapes: Shape[],
  suggestionWidth: number = SUGGESTION_SHAPE_WIDTH,
  suggestionHeight: number = SUGGESTION_SHAPE_HEIGHT,
  existingSuggestionsForTarget: number = 0
): Position {
  // Calculate vertical offset for stacked suggestions
  const stackOffset = existingSuggestionsForTarget * (suggestionHeight + SUGGESTION_STACK_GAP);

  // Calculate center X of target shape
  const targetCenterX = targetShape.x + targetShape.width / 2;

  // Try position: above (preferred)
  const abovePosition: Position = {
    x: targetCenterX - suggestionWidth / 2,
    y: targetShape.y - SUGGESTION_GAP - suggestionHeight - stackOffset,
  };

  if (!positionOverlapsShapes(abovePosition, suggestionWidth, suggestionHeight, existingShapes)) {
    return abovePosition;
  }

  // Try position: to the right
  const rightPosition: Position = {
    x: targetShape.x + targetShape.width + SUGGESTION_GAP,
    y: targetShape.y - stackOffset,
  };

  if (!positionOverlapsShapes(rightPosition, suggestionWidth, suggestionHeight, existingShapes)) {
    return rightPosition;
  }

  // Try position: to the left
  const leftPosition: Position = {
    x: targetShape.x - SUGGESTION_GAP - suggestionWidth,
    y: targetShape.y - stackOffset,
  };

  if (!positionOverlapsShapes(leftPosition, suggestionWidth, suggestionHeight, existingShapes)) {
    return leftPosition;
  }

  // Try position: below
  const belowPosition: Position = {
    x: targetCenterX - suggestionWidth / 2,
    y: targetShape.y + targetShape.height + SUGGESTION_GAP + stackOffset,
  };

  if (!positionOverlapsShapes(belowPosition, suggestionWidth, suggestionHeight, existingShapes)) {
    return belowPosition;
  }

  // Fallback: try further above (keep trying until we find space)
  let offset = SUGGESTION_GAP;
  for (let i = 0; i < 5; i++) {
    offset += suggestionHeight + SUGGESTION_STACK_GAP;
    const farAbovePosition: Position = {
      x: targetCenterX - suggestionWidth / 2,
      y: targetShape.y - offset - stackOffset,
    };

    if (!positionOverlapsShapes(farAbovePosition, suggestionWidth, suggestionHeight, existingShapes)) {
      return farAbovePosition;
    }
  }

  // Ultimate fallback: just place it above regardless of overlap
  return abovePosition;
}

/**
 * Calculate the connection point for a curved connector between suggestion and target
 *
 * Returns the best anchor points for visual connection
 */
export function calculateSuggestionConnectorPoints(
  suggestionPosition: Position,
  suggestionWidth: number,
  suggestionHeight: number,
  targetShape: Shape
): { sourcePoint: Position; targetPoint: Position } {
  const suggestionCenterX = suggestionPosition.x + suggestionWidth / 2;
  const suggestionCenterY = suggestionPosition.y + suggestionHeight / 2;
  const targetCenterX = targetShape.x + targetShape.width / 2;
  const targetCenterY = targetShape.y + targetShape.height / 2;

  // Determine if suggestion is above, below, left, or right of target
  const isAbove = suggestionPosition.y + suggestionHeight < targetShape.y;
  const isBelow = suggestionPosition.y > targetShape.y + targetShape.height;
  const isLeft = suggestionPosition.x + suggestionWidth < targetShape.x;
  const isRight = suggestionPosition.x > targetShape.x + targetShape.width;

  let sourcePoint: Position;
  let targetPoint: Position;

  if (isAbove) {
    // Connect from bottom center of suggestion to top center of target
    sourcePoint = {
      x: suggestionCenterX,
      y: suggestionPosition.y + suggestionHeight,
    };
    targetPoint = {
      x: targetCenterX,
      y: targetShape.y,
    };
  } else if (isBelow) {
    // Connect from top center of suggestion to bottom center of target
    sourcePoint = {
      x: suggestionCenterX,
      y: suggestionPosition.y,
    };
    targetPoint = {
      x: targetCenterX,
      y: targetShape.y + targetShape.height,
    };
  } else if (isLeft) {
    // Connect from right center of suggestion to left center of target
    sourcePoint = {
      x: suggestionPosition.x + suggestionWidth,
      y: suggestionCenterY,
    };
    targetPoint = {
      x: targetShape.x,
      y: targetCenterY,
    };
  } else if (isRight) {
    // Connect from left center of suggestion to right center of target
    sourcePoint = {
      x: suggestionPosition.x,
      y: suggestionCenterY,
    };
    targetPoint = {
      x: targetShape.x + targetShape.width,
      y: targetCenterY,
    };
  } else {
    // Overlapping case - default to bottom-to-top
    sourcePoint = {
      x: suggestionCenterX,
      y: suggestionPosition.y + suggestionHeight,
    };
    targetPoint = {
      x: targetCenterX,
      y: targetShape.y,
    };
  }

  return { sourcePoint, targetPoint };
}
