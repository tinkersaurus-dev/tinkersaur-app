/**
 * Utility functions for calculating the height of diagram shapes
 * based on their content (stereotype, name, attributes, methods, and literals).
 *
 * Covers UML Class, Enumeration, and Entity Relationship shapes.
 */

import type { ClassShapeData, EnumerationShapeData, EntityShapeData } from '@/entities/shape';
import { CANVAS_CONFIG } from '@/shared/lib/config/canvas-config';

/**
 * Constants matching the ClassRenderer / EntityRenderer component layout
 */
const ITEM_LINE_HEIGHT = CANVAS_CONFIG.classLayout.itemLineHeight;

/**
 * Section heights
 */
const STEREOTYPE_SECTION_HEIGHT = CANVAS_CONFIG.classLayout.stereotypeSectionHeight;
const CLASS_NAME_SECTION_HEIGHT = CANVAS_CONFIG.classLayout.classNameSectionHeight;
const EMPTY_SECTION_HEIGHT = CANVAS_CONFIG.classLayout.emptySectionHeight;

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
  totalHeight += CANVAS_CONFIG.classLayout.borderBuffer;

  return Math.max(totalHeight, CANVAS_CONFIG.classLayout.minHeight);
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
  totalHeight += CANVAS_CONFIG.classLayout.borderBuffer;

  return Math.max(totalHeight, CANVAS_CONFIG.classLayout.minHeight);
}

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
  totalHeight += CLASS_NAME_SECTION_HEIGHT;

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
