/**
 * Containment Detection Utilities
 * Functions for detecting parent-child containment relationships between shapes
 */

import type { Shape } from '@/entities/shape';

/**
 * Check if a shape is visually inside a container shape
 * Uses center point of child shape to determine containment
 *
 * @param childShape - The potential child shape
 * @param parentShape - The potential parent container shape
 * @returns true if child's center is inside parent's bounds
 */
export function isShapeInsideContainer(
  childShape: Shape,
  parentShape: Shape
): boolean {
  // Calculate center point of child shape
  const childCenterX = childShape.x + childShape.width / 2;
  const childCenterY = childShape.y + childShape.height / 2;

  // Check if center point is within parent bounds
  const isInsideX = childCenterX >= parentShape.x &&
                     childCenterX <= parentShape.x + parentShape.width;
  const isInsideY = childCenterY >= parentShape.y &&
                     childCenterY <= parentShape.y + parentShape.height;

  return isInsideX && isInsideY;
}

/**
 * Find the container that a shape should belong to based on position
 * Returns the deepest (most nested) container that contains the shape
 *
 * @param shape - The shape to find a container for
 * @param allShapes - All shapes in the diagram
 * @param excludeShapeIds - Shape IDs to exclude from consideration (e.g., the shape itself and its descendants)
 * @returns The container shape, or null if not inside any container
 */
export function findContainerAtPosition(
  shape: Shape,
  allShapes: Shape[],
  excludeShapeIds: Set<string> = new Set()
): Shape | null {
  // Filter to only container types and exclude specified shapes
  const containers = allShapes.filter(
    s => isContainerType(s.type) &&
         s.id !== shape.id &&
         !excludeShapeIds.has(s.id)
  );

  // Find all containers that contain this shape
  const containingContainers = containers.filter(container =>
    isShapeInsideContainer(shape, container)
  );

  // If no containers found, return null
  if (containingContainers.length === 0) {
    return null;
  }

  // Return the smallest container (most nested / deepest in hierarchy)
  // Smallest area = most specific container
  return containingContainers.reduce((smallest, current) => {
    const smallestArea = smallest.width * smallest.height;
    const currentArea = current.width * current.height;
    return currentArea < smallestArea ? current : smallest;
  });
}

/**
 * Check if a shape type is a container type
 * Container types can have children
 *
 * @param shapeType - The shape type to check
 * @returns true if the shape type is a container
 */
export function isContainerType(shapeType: string): boolean {
  // Currently only architecture-group is a container
  // Add more container types here as they're implemented
  return shapeType === 'architecture-group';
}

/**
 * Get all descendant shape IDs (children, grandchildren, etc.) recursively
 *
 * @param shapeId - The parent shape ID
 * @param allShapes - All shapes in the diagram
 * @returns Set of all descendant shape IDs
 */
export function getAllDescendantIds(
  shapeId: string,
  allShapes: Shape[]
): Set<string> {
  const descendants = new Set<string>();
  const shapeMap = new Map(allShapes.map(s => [s.id, s]));

  const collectDescendants = (id: string) => {
    const shape = shapeMap.get(id);
    if (!shape || !shape.children) return;

    for (const childId of shape.children) {
      descendants.add(childId);
      collectDescendants(childId); // Recurse for nested children
    }
  };

  collectDescendants(shapeId);
  return descendants;
}

/**
 * Get all ancestor shape IDs (parent, grandparent, etc.) recursively
 *
 * @param shapeId - The child shape ID
 * @param allShapes - All shapes in the diagram
 * @returns Set of all ancestor shape IDs
 */
export function getAllAncestorIds(
  shapeId: string,
  allShapes: Shape[]
): Set<string> {
  const ancestors = new Set<string>();
  const shapeMap = new Map(allShapes.map(s => [s.id, s]));

  let currentId: string | undefined = shapeId;
  while (currentId) {
    const shape = shapeMap.get(currentId);
    if (!shape?.parentId) break;

    ancestors.add(shape.parentId);
    currentId = shape.parentId;
  }

  return ancestors;
}

/**
 * Build a set containing a shape and all its descendants
 * Useful for operations that should affect entire subtrees
 *
 * @param shapeId - The root shape ID
 * @param allShapes - All shapes in the diagram
 * @returns Set containing the shape ID and all descendant IDs
 */
export function getShapeWithDescendants(
  shapeId: string,
  allShapes: Shape[]
): Set<string> {
  const result = new Set<string>();
  result.add(shapeId);

  const descendants = getAllDescendantIds(shapeId, allShapes);
  descendants.forEach(id => result.add(id));

  return result;
}
