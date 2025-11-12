/**
 * Viewport Abstraction
 *
 * Bundles viewport state (zoom, panX, panY) with coordinate transformation methods
 * to reduce prop drilling and keep related methods with data.
 *
 * Benefits:
 * - Single object instead of 3-4 separate props
 * - Type-safe coordinate transformations bound to current viewport state
 * - Easier testing and mocking
 * - Better encapsulation of viewport logic
 */

import {
  screenToCanvas as screenToCanvasUtil,
  canvasToScreen as canvasToScreenUtil,
  constrainZoom as constrainZoomUtil,
  calculateZoomFromWheel,
  calculateZoomToPoint,
} from './canvas';

/**
 * Viewport state interface
 * Contains the core viewport transformation parameters
 */
export interface Viewport {
  /** Current zoom level (1 = 100%, 0.1 = 10%, 5 = 500%) */
  zoom: number;
  /** Pan offset X in screen pixels */
  panX: number;
  /** Pan offset Y in screen pixels */
  panY: number;
}

/**
 * Viewport transform interface
 * Bundles viewport state with transformation methods
 */
export interface ViewportTransform {
  /** Current viewport state */
  viewport: Viewport;

  /** Update viewport state */
  setViewport: (zoom: number, panX: number, panY: number) => void;

  /**
   * Convert screen coordinates to canvas coordinates
   * Accounts for current zoom and pan transformations
   */
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };

  /**
   * Convert canvas coordinates to screen coordinates
   * Accounts for current zoom and pan transformations
   */
  canvasToScreen: (canvasX: number, canvasY: number) => { x: number; y: number };

  /**
   * Get CSS transform string for current viewport
   * Returns string like "translate(100px, 50px) scale(1.5)"
   */
  getTransformString: () => string;

  /**
   * Constrain zoom level to valid range (0.1x to 5x)
   */
  constrainZoom: (zoom: number) => number;

  /**
   * Calculate new zoom level from mouse wheel delta
   */
  calculateZoomFromWheel: (deltaY: number, sensitivity?: number) => number;

  /**
   * Calculate pan adjustment to zoom toward a specific point
   * Keeps the cursor position fixed during zoom
   */
  calculateZoomToPoint: (
    cursorX: number,
    cursorY: number,
    newZoom: number
  ) => { panX: number; panY: number };
}

/**
 * Create a viewport transform object
 *
 * Factory function that creates a ViewportTransform object with all transformation
 * methods bound to the current viewport state.
 *
 * @param viewport - Current viewport state (zoom, panX, panY)
 * @param setViewport - Function to update viewport state
 * @returns ViewportTransform object with all methods bound to viewport state
 *
 * @example
 * ```ts
 * const viewportTransform = createViewportTransform(
 *   { zoom: 1, panX: 0, panY: 0 },
 *   (zoom, panX, panY) => setState({ zoom, panX, panY })
 * );
 *
 * // Use transformation methods
 * const canvasPos = viewportTransform.screenToCanvas(mouseX, mouseY);
 * const transformStr = viewportTransform.getTransformString();
 * ```
 */
export function createViewportTransform(
  viewport: Viewport,
  setViewport: (zoom: number, panX: number, panY: number) => void
): ViewportTransform {
  return {
    viewport,
    setViewport,

    // Coordinate transformations bound to current viewport state
    screenToCanvas: (screenX: number, screenY: number) =>
      screenToCanvasUtil(screenX, screenY, viewport.zoom, viewport.panX, viewport.panY),

    canvasToScreen: (canvasX: number, canvasY: number) =>
      canvasToScreenUtil(canvasX, canvasY, viewport.zoom, viewport.panX, viewport.panY),

    // Helper methods
    getTransformString: () =>
      `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,

    constrainZoom: (zoom: number) => constrainZoomUtil(zoom),

    calculateZoomFromWheel: (deltaY: number, sensitivity?: number) =>
      calculateZoomFromWheel(viewport.zoom, deltaY, sensitivity),

    calculateZoomToPoint: (cursorX: number, cursorY: number, newZoom: number) =>
      calculateZoomToPoint(
        cursorX,
        cursorY,
        viewport.zoom,
        newZoom,
        viewport.panX,
        viewport.panY
      ),
  };
}
