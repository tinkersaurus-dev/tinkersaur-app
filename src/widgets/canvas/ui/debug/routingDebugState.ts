import type { OrthogonalVisibilityGraph } from '../../lib/utils/routing';

/**
 * Global debug state for routing visualization
 */

// Global debug state
let debugGraph: OrthogonalVisibilityGraph | null = null;
let debugStart: { x: number; y: number } | null = null;
let debugEnd: { x: number; y: number } | null = null;
let debugPath: Array<{ x: number; y: number }> | null = null;
let debugVisitedNodes: Array<{ x: number; y: number; order: number }> = [];

export function setDebugGraph(
  graph: OrthogonalVisibilityGraph | null,
  start?: { x: number; y: number },
  end?: { x: number; y: number },
  path?: Array<{ x: number; y: number }>,
  visitedNodes?: Array<{ x: number; y: number; order: number }>
) {
  debugGraph = graph;
  debugStart = start || null;
  debugEnd = end || null;
  debugPath = path || null;
  debugVisitedNodes = visitedNodes || [];
  // Trigger re-render of any mounted debug overlays
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('routing-debug-update'));
  }
}

export function getDebugState() {
  return {
    debugGraph,
    debugStart,
    debugEnd,
    debugPath,
    debugVisitedNodes
  };
}

export function clearDebugState() {
  debugGraph = null;
  debugStart = null;
  debugEnd = null;
  debugPath = null;
  debugVisitedNodes = [];
}
