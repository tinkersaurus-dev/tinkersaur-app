/**
 * Sequence Activation Calculator
 *
 * Calculates activation boxes for sequence diagram lifelines based on message connectors.
 * Activation boxes represent periods when a participant is actively processing.
 */

import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { ActivationBox } from '~/core/entities/design-studio/types/Shape';
import {
  SEQUENCE_LIFELINE_CONNECTION_POINTS,
  findConnectionPointById,
} from './connectionPoints';

/**
 * Calculates activation boxes for a sequence diagram lifeline based on connected messages.
 *
 * Algorithm:
 * 1. Find all incoming messages (messages targeting this lifeline)
 * 2. For each incoming message, look for a corresponding return message going back
 * 3. Create activation from incoming Y to return Y (or default length if no return)
 * 4. Handle nesting by tracking activation depth based on overlaps
 *
 * @param lifeline - The sequence lifeline shape
 * @param connectors - All connectors in the diagram
 * @returns Array of activation boxes sorted by startY
 */
export function calculateActivations(
  lifeline: Shape,
  connectors: Connector[]
): ActivationBox[] {
  // Only process sequence lifelines
  if (lifeline.type !== 'sequence-lifeline') {
    return [];
  }

  // Find all message connectors involving this lifeline
  const incomingMessages = connectors.filter(
    (c) =>
      c.targetShapeId === lifeline.id &&
      c.type.startsWith('sequence-') &&
      c.type !== 'sequence-return' && // Returns don't start activations
      c.targetConnectionPoint
  );

  const outgoingReturns = connectors.filter(
    (c) =>
      c.sourceShapeId === lifeline.id &&
      c.type === 'sequence-return' &&
      c.sourceConnectionPoint
  );

  // If no incoming messages, no activations
  if (incomingMessages.length === 0) {
    return [];
  }

  const DEFAULT_ACTIVATION_LENGTH = 80; // 2 connection point intervals
  const activations: ActivationBox[] = [];

  // Track which returns have been matched to avoid reusing them
  const usedReturns = new Set<string>();

  // For each incoming message, try to find a corresponding return
  for (const incoming of incomingMessages) {
    const startY = extractYOffsetFromConnectionPoint(incoming.targetConnectionPoint!);
    if (startY === null) continue;

    // Get the direction of the incoming message at this lifeline
    // Messages arrive from the west (w-X) or east (e-X)
    const incomingDirection = getConnectionPointDirection(incoming.targetConnectionPoint!);

    // Find the closest return message going back to the sender
    // It should be:
    // 1. A return message FROM this lifeline TO the source of the incoming message
    // 2. Leaving from the SAME side (if message came from west, return goes east, and vice versa)
    // 3. At a Y position at or below the incoming message
    // 4. Not already used by another activation
    const potentialReturns = outgoingReturns
      .filter((ret) => {
        if (usedReturns.has(ret.id)) return false;
        if (ret.targetShapeId !== incoming.sourceShapeId) return false;

        // Check direction: return should leave from the same side the message arrived
        const returnDirection = getConnectionPointDirection(ret.sourceConnectionPoint!);
        if (returnDirection !== incomingDirection) return false;

        const returnY = extractYOffsetFromConnectionPoint(ret.sourceConnectionPoint!);
        if (returnY === null) return false;

        // Return must be at or below the incoming message
        return returnY >= startY;
      })
      .sort((a, b) => {
        // Sort by Y position to find the closest one
        const yA = extractYOffsetFromConnectionPoint(a.sourceConnectionPoint!)!;
        const yB = extractYOffsetFromConnectionPoint(b.sourceConnectionPoint!)!;
        return yA - yB;
      });

    let endY: number;
    if (potentialReturns.length > 0) {
      const matchingReturn = potentialReturns[0];
      endY = extractYOffsetFromConnectionPoint(matchingReturn.sourceConnectionPoint!)!;
      usedReturns.add(matchingReturn.id);
    } else {
      // No return found, use default length
      endY = startY + DEFAULT_ACTIVATION_LENGTH;
    }

    activations.push({
      startY,
      endY,
      depth: 0, // Will calculate depth in a second pass
    });
  }

  // Sort activations by startY
  activations.sort((a, b) => a.startY - b.startY);

  // Calculate nesting depth
  // An activation is nested if it starts while another is active
  for (let i = 0; i < activations.length; i++) {
    let depth = 0;
    const current = activations[i];

    // Count how many activations contain this one's start point
    for (let j = 0; j < i; j++) {
      const other = activations[j];
      if (other.startY < current.startY && other.endY > current.startY) {
        depth++;
      }
    }

    activations[i].depth = depth;
  }

  return activations;
}

/**
 * Extracts the direction (e or w) from a connection point ID.
 *
 * Connection point IDs are in format: "e-0", "w-3", etc.
 * The first character indicates the direction (east or west).
 *
 * @param connectionPointId - The connection point ID (e.g., "e-0", "w-3")
 * @returns The direction ('e' or 'w'), or null if not found
 */
function getConnectionPointDirection(connectionPointId: string): string | null {
  if (!connectionPointId) return null;

  // Connection point IDs are in format "e-0", "w-3", etc.
  // The part before the hyphen is the direction
  const parts = connectionPointId.split('-');
  if (parts.length < 2) return null;

  const direction = parts[0];
  if (direction === 'e' || direction === 'w') {
    return direction;
  }

  return null;
}

/**
 * Extracts the Y-offset (fixedOffsetY) from a connection point ID.
 *
 * Connection point IDs are in format: "e-0", "w-3", etc.
 * We need to look up the corresponding fixedOffsetY from the connection point definition.
 *
 * @param connectionPointId - The connection point ID (e.g., "e-0", "w-3")
 * @returns The Y-offset in pixels, or null if not found
 */
function extractYOffsetFromConnectionPoint(connectionPointId: string): number | null {
  const connectionPoint = findConnectionPointById(
    SEQUENCE_LIFELINE_CONNECTION_POINTS,
    connectionPointId
  );

  if (!connectionPoint || connectionPoint.fixedOffsetY === undefined) {
    return null;
  }

  return connectionPoint.fixedOffsetY;
}

/**
 * Calculates activations for all lifelines in a diagram.
 *
 * @param shapes - All shapes in the diagram
 * @param connectors - All connectors in the diagram
 * @returns Map of shapeId to activation boxes
 */
export function calculateAllLifelineActivations(
  shapes: Shape[],
  connectors: Connector[]
): Map<string, ActivationBox[]> {
  const activationsMap = new Map<string, ActivationBox[]>();

  const lifelines = shapes.filter((s) => s.type === 'sequence-lifeline');

  for (const lifeline of lifelines) {
    const activations = calculateActivations(lifeline, connectors);
    activationsMap.set(lifeline.id, activations);
  }

  return activationsMap;
}
