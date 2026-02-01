/**
 * Default Shape Subtypes Configuration
 *
 * Defines the default subtypes to assign when creating shapes from mermaid diagrams
 * or other sources that don't specify a subtype.
 */

/**
 * Default subtypes for each shape type
 */
export const DEFAULT_SHAPE_SUBTYPES: Record<string, string> = {
  'bpmn-task': 'user',
  'bpmn-event': 'start', // Will be overridden by position-based logic
  'bpmn-gateway': 'exclusive',
  'sequence-lifeline': 'object',
  'architecture-service': 'cloud',
};

/**
 * Determines the appropriate BPMN event subtype based on graph position.
 *
 * @param isFirst - Whether this is the first node in the graph
 * @param isLast - Whether this is the last node in the graph
 * @returns The appropriate event subtype
 */
export function getBpmnEventSubtype(isFirst: boolean, isLast: boolean): string {
  if (isFirst) return 'start';
  if (isLast) return 'end';
  return 'catching'; // Default for intermediate events
}

/**
 * Gets the default subtype for a given shape type.
 *
 * @param shapeType - The shape type to get the default subtype for
 * @returns The default subtype, or undefined if none exists
 */
export function getDefaultSubtype(shapeType: string): string | undefined {
  return DEFAULT_SHAPE_SUBTYPES[shapeType];
}
