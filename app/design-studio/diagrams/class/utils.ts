/**
 * Utility functions for calculating the height of UML class diagram shapes
 * based on their content (stereotype, name, attributes, methods, and literals).
 *
 * Includes utilities for both Class and Enumeration shapes.
 */

import type { ClassShapeData, EnumerationShapeData } from '~/core/entities/design-studio/types/Shape';
import { DESIGN_STUDIO_CONFIG } from '~/design-studio/config/design-studio-config';

/**
 * Constants matching the ClassRenderer component layout
 */
const ITEM_LINE_HEIGHT = DESIGN_STUDIO_CONFIG.classLayout.itemLineHeight;

/**
 * Section heights
 */
const STEREOTYPE_SECTION_HEIGHT = DESIGN_STUDIO_CONFIG.classLayout.stereotypeSectionHeight;
const CLASS_NAME_SECTION_HEIGHT = DESIGN_STUDIO_CONFIG.classLayout.classNameSectionHeight;
const EMPTY_SECTION_HEIGHT = DESIGN_STUDIO_CONFIG.classLayout.emptySectionHeight;

/**
 * Calculate the total height of a UML class shape based on its content.
 *
 * @param classData - The class shape data containing attributes and methods
 * @returns The calculated height in pixels
 */
export function calculateClassHeight(classData: ClassShapeData): number {
  const attributes = classData.attributes || [];
  const methods = classData.methods || [];

  let totalHeight = 0;

  // Stereotype section
  totalHeight += STEREOTYPE_SECTION_HEIGHT;

  // Class name section
  totalHeight += CLASS_NAME_SECTION_HEIGHT;

  // Attributes section
  if (attributes.length === 0) {
    totalHeight += EMPTY_SECTION_HEIGHT;
  } else {
    totalHeight += (attributes.length * ITEM_LINE_HEIGHT);
  }

  // Methods section
  if (methods.length === 0) {
    totalHeight += EMPTY_SECTION_HEIGHT;
  } else {
    totalHeight += (methods.length * ITEM_LINE_HEIGHT);
  }

  // Add a small buffer for borders
  totalHeight += DESIGN_STUDIO_CONFIG.classLayout.borderBuffer;

  return Math.max(totalHeight, DESIGN_STUDIO_CONFIG.classLayout.minHeight);
}

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
  totalHeight += CLASS_NAME_SECTION_HEIGHT;

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
