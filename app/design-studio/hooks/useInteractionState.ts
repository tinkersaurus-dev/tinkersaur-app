import { useState, useCallback } from 'react';
import type { ResizeHandle, Bounds, DominantAxis } from '../utils/resize';

// Re-export DominantAxis for consumers who import from this module
export type { DominantAxis } from '../utils/resize';

/**
 * Interaction modes for the canvas
 */
export type InteractionMode =
  | 'idle'
  | 'panning'
  | 'dragging-shapes'
  | 'selecting'
  | 'drawing-connector'
  | 'resizing-shapes';

/**
 * Selection box data
 */
export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Drawing connector data
 */
export interface DrawingConnector {
  fromShapeId: string;
  fromConnectionPointId: string;
  currentX: number;
  currentY: number;
  connectorType: string; // The type of connector being drawn (e.g., 'sequence-flow', 'association')
  sourceDirection?: 'N' | 'S' | 'E' | 'W'; // Direction from the source connection point
  targetShapeId?: string; // Optional: ID of the shape being hovered over
  targetDirection?: 'N' | 'S' | 'E' | 'W'; // Optional: Direction to the target connection point
}

/**
 * Drag data for shape dragging
 */
export interface DragData {
  startCanvasPos: { x: number; y: number };
  shapesStartPositions: Map<string, { x: number; y: number }>;
  delta: { x: number; y: number } | null;
}

/**
 * Resize data for shape resizing
 */
export interface ResizeData {
  handle: ResizeHandle;
  startCanvasPos: { x: number; y: number };
  shapesOriginalBounds: Map<string, Bounds>;
  aspectRatios: Map<string, number>; // width/height for corner handles
  childrenBounds: Map<string, Bounds | null>; // constraints per shape
  delta: { x: number; y: number } | null;
  dominantAxis: DominantAxis; // locked axis for corner handles (aspect ratio)
}

/**
 * Mode-specific data for each interaction type
 */
export type InteractionData =
  | { mode: 'idle'; data: null }
  | { mode: 'panning'; data: null }
  | { mode: 'dragging-shapes'; data: DragData }
  | { mode: 'selecting'; data: SelectionBox }
  | { mode: 'drawing-connector'; data: DrawingConnector }
  | { mode: 'resizing-shapes'; data: ResizeData };

/**
 * Unified interaction state machine hook
 *
 * Replaces multiple boolean flags with a single state machine that ensures
 * only one interaction mode is active at a time.
 *
 * Benefits:
 * - Mutually exclusive states (impossible to be panning AND dragging)
 * - Single source of truth
 * - Type-safe transitions
 * - Clearer reasoning about interaction flow
 */
export function useInteractionState() {
  const [state, setState] = useState<InteractionData>({
    mode: 'idle',
    data: null,
  });

  /**
   * Reset to idle state
   */
  const reset = useCallback(() => {
    setState({ mode: 'idle', data: null });
  }, []);

  /**
   * Start panning mode
   */
  const startPanning = useCallback(() => {
    setState({ mode: 'panning', data: null });
  }, []);

  /**
   * Start dragging shapes mode
   */
  const startDragging = useCallback((dragData: DragData) => {
    setState({ mode: 'dragging-shapes', data: dragData });
  }, []);

  /**
   * Update dragging shapes data
   */
  const updateDragging = useCallback((delta: { x: number; y: number }) => {
    setState((prev) => {
      if (prev.mode !== 'dragging-shapes') return prev;
      return {
        mode: 'dragging-shapes',
        data: { ...prev.data, delta },
      };
    });
  }, []);

  /**
   * Start selecting mode
   */
  const startSelecting = useCallback((selectionBox: SelectionBox) => {
    setState({ mode: 'selecting', data: selectionBox });
  }, []);

  /**
   * Update selection box
   */
  const updateSelecting = useCallback((selectionBox: SelectionBox) => {
    setState((prev) => {
      if (prev.mode !== 'selecting') return prev;
      return { mode: 'selecting', data: selectionBox };
    });
  }, []);

  /**
   * Start drawing connector mode
   */
  const startDrawingConnector = useCallback((connectorData: DrawingConnector) => {
    setState({ mode: 'drawing-connector', data: connectorData });
  }, []);

  /**
   * Update drawing connector position
   */
  const updateDrawingConnector = useCallback((currentX: number, currentY: number) => {
    setState((prev) => {
      if (prev.mode !== 'drawing-connector') return prev;
      return {
        mode: 'drawing-connector',
        data: { ...prev.data, currentX, currentY },
      };
    });
  }, []);

  /**
   * Start resizing shapes mode
   */
  const startResizing = useCallback((resizeData: ResizeData) => {
    setState({ mode: 'resizing-shapes', data: resizeData });
  }, []);

  /**
   * Update resizing shapes data
   */
  const updateResizing = useCallback((delta: { x: number; y: number }) => {
    setState((prev) => {
      if (prev.mode !== 'resizing-shapes') return prev;
      return {
        mode: 'resizing-shapes',
        data: { ...prev.data, delta },
      };
    });
  }, []);

  return {
    mode: state.mode,
    data: state.data,
    reset,
    startPanning,
    startDragging,
    updateDragging,
    startSelecting,
    updateSelecting,
    startDrawingConnector,
    updateDrawingConnector,
    startResizing,
    updateResizing,
  };
}
