/**
 * Utility functions for calculating the height of UML class diagrams
 * based on their content (stereotype, class name, attributes, and methods).
 */

import type { ClassShapeData } from '~/core/entities/design-studio/types/Shape';

/**
 * Constants matching the ClassRenderer component layout
 */
const LINE_HEIGHT = 28;
const ITEM_LINE_HEIGHT = 28; // Approximate height of each attribute/method item

/**
 * Section heights
 */
const STEREOTYPE_SECTION_HEIGHT = LINE_HEIGHT; // minHeight + top/bottom padding
const CLASS_NAME_SECTION_HEIGHT = 40; // minHeight + padding
const EMPTY_SECTION_HEIGHT = LINE_HEIGHT; // minHeight + padding for "No attributes/methods"

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
  totalHeight += 4;

  return Math.max(totalHeight, 150); // Minimum height of 150px
}
