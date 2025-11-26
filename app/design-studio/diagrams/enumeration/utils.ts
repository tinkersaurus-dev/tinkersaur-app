/**
 * Utility functions for calculating the height of UML enumeration diagrams
 * based on their content (stereotype, enumeration name, and literals).
 */

import type { EnumerationShapeData } from '~/core/entities/design-studio/types/Shape';
import { DESIGN_STUDIO_CONFIG } from '~/design-studio/config/design-studio-config';

/**
 * Constants matching the EnumerationRenderer component layout
 */
const ITEM_LINE_HEIGHT = DESIGN_STUDIO_CONFIG.classLayout.itemLineHeight;

/**
 * Section heights (reusing class layout config for consistency)
 */
const STEREOTYPE_SECTION_HEIGHT = DESIGN_STUDIO_CONFIG.classLayout.stereotypeSectionHeight;
const ENUMERATION_NAME_SECTION_HEIGHT = DESIGN_STUDIO_CONFIG.classLayout.classNameSectionHeight;
const EMPTY_SECTION_HEIGHT = DESIGN_STUDIO_CONFIG.classLayout.emptySectionHeight;

/**
 * Calculate the total height of a UML enumeration shape based on its content.
 *
 * @param enumerationData - The enumeration shape data containing literals
 * @returns The calculated height in pixels
 */
export function calculateEnumerationHeight(enumerationData: EnumerationShapeData): number {
  const literals = enumerationData.literals || [];

  let totalHeight = 0;

  // Stereotype section (always shows "<<enumeration>>")
  totalHeight += STEREOTYPE_SECTION_HEIGHT;

  // Enumeration name section
  totalHeight += ENUMERATION_NAME_SECTION_HEIGHT;

  // Literals section
  if (literals.length === 0) {
    totalHeight += EMPTY_SECTION_HEIGHT;
  } else {
    totalHeight += (literals.length * ITEM_LINE_HEIGHT);
  }

  // Add a small buffer for borders
  totalHeight += DESIGN_STUDIO_CONFIG.classLayout.borderBuffer;

  return Math.max(totalHeight, DESIGN_STUDIO_CONFIG.classLayout.minHeight);
}
