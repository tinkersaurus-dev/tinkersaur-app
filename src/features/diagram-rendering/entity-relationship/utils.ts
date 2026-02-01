/**
 * Utility functions for calculating the height of Entity Relationship diagram shapes
 * based on their content (entity name and attributes).
 */

import type { EntityShapeData } from '@/entities/shape';
import { CANVAS_CONFIG } from '@/shared/lib/config/canvas-config';

/**
 * Constants matching the EntityRenderer component layout
 */
const ITEM_LINE_HEIGHT = CANVAS_CONFIG.classLayout.itemLineHeight;

/**
 * Section heights
 */
const ENTITY_NAME_SECTION_HEIGHT = CANVAS_CONFIG.classLayout.classNameSectionHeight;
const EMPTY_SECTION_HEIGHT = CANVAS_CONFIG.classLayout.emptySectionHeight;

/**
 * Calculate the total height of an entity shape based on its content.
 *
 * @param entityData - The entity shape data containing attributes
 * @returns The calculated height in pixels
 */
export function calculateEntityHeight(entityData: EntityShapeData): number {
  const attributes = entityData.attributes || [];

  let totalHeight = 0;

  // Entity name section
  totalHeight += ENTITY_NAME_SECTION_HEIGHT;

  // Attributes section
  if (attributes.length === 0) {
    totalHeight += EMPTY_SECTION_HEIGHT;
  } else {
    totalHeight += (attributes.length * ITEM_LINE_HEIGHT);
  }

  // Add a small buffer for borders
  totalHeight += CANVAS_CONFIG.classLayout.borderBuffer;

  return Math.max(totalHeight, CANVAS_CONFIG.classLayout.minHeight);
}
