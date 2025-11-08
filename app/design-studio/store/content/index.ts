/**
 * Canvas Instance Store System
 *
 * Per-instance stores for canvas state isolation.
 * Each open diagram tab gets its own isolated store instance.
 */

export { createCanvasInstanceStore } from './createCanvasInstanceStore';
export { canvasInstanceRegistry } from './canvasInstanceRegistry';
export { useCanvasInstance } from './useCanvasInstance';

export type { CanvasInstanceState, CanvasInstanceStore } from './createCanvasInstanceStore';
