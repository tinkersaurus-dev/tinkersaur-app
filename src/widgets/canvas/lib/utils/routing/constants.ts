/**
 * Constants for orthogonal connector routing
 */

export { CANVAS_CONFIG } from '../../config/design-studio-config';

/** Magic numbers and configuration constants */
export const ROUTING_CONSTANTS = {
  /** Maximum iterations for A* search before giving up */
  MAX_ASTAR_ITERATIONS: 1000,

  /** Cost weight for bend count in A* heuristic */
  BEND_COST_WEIGHT: 1,

  /** Cost weight for estimated remaining segments in A* heuristic */
  ESTIMATED_SEGMENTS_WEIGHT: 1,

  /** Precision for node ID generation (100 = 2 decimal places) */
  NODE_ID_PRECISION: 100,
} as const;
