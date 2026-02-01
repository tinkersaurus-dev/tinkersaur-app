import { createContext, useContext } from 'react';
import type { ViewportTransform } from '../../lib/utils/viewport';

/**
 * Canvas Viewport Context
 *
 * Provides viewport transformation state and utilities for the Canvas component.
 * This context handles zoom, pan, and coordinate transformation between screen and canvas space.
 */
export interface CanvasViewportContext {
  // Viewport Transform
  viewportTransform: ViewportTransform;
}

/**
 * React Context for Canvas Viewport
 */
export const ViewportContext = createContext<CanvasViewportContext | null>(null);

/**
 * Hook to consume Canvas Viewport context
 *
 * @throws Error if used outside of CanvasViewportContext provider
 * @returns Canvas viewport context with transformation utilities
 */
export function useCanvasViewport(): CanvasViewportContext {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error('useCanvasViewport must be used within a CanvasViewportContext provider');
  }
  return context;
}
