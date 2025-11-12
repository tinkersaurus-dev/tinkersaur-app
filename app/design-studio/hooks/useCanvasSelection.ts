import type { MutableRefObject, RefObject } from 'react';
import type { Shape, Connector } from '~/core/entities/design-studio/types';
import type { SelectionBox } from './useInteractionState';
import {
  normalizeRectangle,
  getShapeBounds,
  getConnectorBounds,
  rectanglesIntersect,
  screenToCanvas,
  distance,
} from '../utils/canvas';

interface UseCanvasSelectionProps {
  containerRef: RefObject<HTMLDivElement | null>;
  lastMousePosRef: MutableRefObject<{ x: number; y: number }>;
  zoom: number;
  panX: number;
  panY: number;
  shapes: Shape[];
  connectors: Connector[];
  clearSelection: () => void;
  setSelection: (shapeIds: string[], connectorIds: string[]) => void;
  isActive: boolean; // Driven by state machine
  selectionBox: SelectionBox | null; // From state machine
}

interface UseCanvasSelectionReturn {
  startSelection: (screenX: number, screenY: number) => SelectionBox;
  updateSelection: (screenX: number, screenY: number) => SelectionBox;
  finishSelection: (screenX: number, screenY: number) => void;
}

/**
 * Hook for managing selection box and multi-select functionality
 * State is managed externally by the interaction state machine
 */
export function useCanvasSelection({
  containerRef,
  lastMousePosRef,
  zoom,
  panX,
  panY,
  shapes,
  connectors,
  clearSelection,
  setSelection,
  isActive,
  selectionBox,
}: UseCanvasSelectionProps): UseCanvasSelectionReturn {
  const startSelection = (screenX: number, screenY: number): SelectionBox => {
    lastMousePosRef.current = { x: screenX, y: screenY };

    return {
      startX: screenX,
      startY: screenY,
      endX: screenX,
      endY: screenY,
    };
  };

  const updateSelection = (screenX: number, screenY: number): SelectionBox => {
    if (!isActive || !selectionBox) {
      return selectionBox || { startX: 0, startY: 0, endX: 0, endY: 0 };
    }

    return { ...selectionBox, endX: screenX, endY: screenY };
  };

  const finishSelection = (screenX: number, screenY: number) => {
    const container = containerRef.current;
    if (!container || !selectionBox) {
      return;
    }

    // Calculate drag distance to detect click vs drag
    const dragDistance = distance(
      { x: screenX, y: screenY },
      lastMousePosRef.current
    );

    if (dragDistance < 5) {
      // Just a click, clear selection
      clearSelection();
    } else {
      // It was a drag, select shapes and connectors in box
      const selectedShapeIds: string[] = [];
      const selectedConnectorIds: string[] = [];

      // Normalize selection box coordinates (handle drag in any direction)
      const screenBox = normalizeRectangle(
        selectionBox.startX,
        selectionBox.startY,
        selectionBox.endX,
        selectionBox.endY
      );

      // Convert selection box from screen space to canvas space
      const { x: canvasBoxLeft, y: canvasBoxTop } = screenToCanvas(
        screenBox.left,
        screenBox.top,
        zoom,
        panX,
        panY
      );
      const { x: canvasBoxRight, y: canvasBoxBottom } = screenToCanvas(
        screenBox.right,
        screenBox.bottom,
        zoom,
        panX,
        panY
      );

      const canvasBox = {
        left: canvasBoxLeft,
        right: canvasBoxRight,
        top: canvasBoxTop,
        bottom: canvasBoxBottom,
      };

      // Check each shape for intersection using AABB algorithm
      shapes.forEach((shape) => {
        const shapeBounds = getShapeBounds(shape);

        if (rectanglesIntersect(canvasBox, shapeBounds)) {
          selectedShapeIds.push(shape.id);
        }
      });

      // Create a shape map for connector bounds calculation
      const shapeMap = new Map(shapes.map((shape) => [shape.id, shape]));

      // Check each connector for intersection using AABB algorithm
      connectors.forEach((connector) => {
        const sourceShape = shapeMap.get(connector.sourceShapeId);
        const targetShape = shapeMap.get(connector.targetShapeId);

        // Skip if either shape is missing
        if (!sourceShape || !targetShape) return;

        const connectorBounds = getConnectorBounds(connector, sourceShape, targetShape);

        if (rectanglesIntersect(canvasBox, connectorBounds)) {
          selectedConnectorIds.push(connector.id);
        }
      });

      // Use the setSelection action to select both shapes and connectors
      setSelection(selectedShapeIds, selectedConnectorIds);
    }
  };

  return {
    startSelection,
    updateSelection,
    finishSelection,
  };
}
