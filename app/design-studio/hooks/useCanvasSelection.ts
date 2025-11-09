import { useState, useRef } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import type { Shape, Connector } from '~/core/entities/design-studio/types';
import {
  normalizeRectangle,
  getShapeBounds,
  getConnectorBounds,
  rectanglesIntersect,
  screenToCanvas,
  distance,
} from '../utils/canvas';

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

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
}

interface UseCanvasSelectionReturn {
  selectionBox: SelectionBox | null;
  setSelectionBox: (box: SelectionBox | null) => void;
  isSelectingRef: MutableRefObject<boolean>;
  startSelection: (screenX: number, screenY: number) => void;
  updateSelection: (screenX: number, screenY: number) => void;
  finishSelection: (screenX: number, screenY: number) => void;
  cancelSelection: () => void;
}

/**
 * Hook for managing selection box and multi-select functionality
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
}: UseCanvasSelectionProps): UseCanvasSelectionReturn {
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const isSelectingRef = useRef(false);

  const startSelection = (screenX: number, screenY: number) => {
    isSelectingRef.current = true;
    lastMousePosRef.current = { x: screenX, y: screenY };

    setSelectionBox({
      startX: screenX,
      startY: screenY,
      endX: screenX,
      endY: screenY,
    });
  };

  const updateSelection = (screenX: number, screenY: number) => {
    if (!isSelectingRef.current) return;

    setSelectionBox((prev) =>
      prev ? { ...prev, endX: screenX, endY: screenY } : null
    );
  };

  const finishSelection = (screenX: number, screenY: number) => {
    const container = containerRef.current;
    if (!container || !selectionBox) {
      isSelectingRef.current = false;
      setSelectionBox(null);
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

    // Reset selection box state
    isSelectingRef.current = false;
    setSelectionBox(null);
  };

  const cancelSelection = () => {
    isSelectingRef.current = false;
    setSelectionBox(null);
  };

  return {
    selectionBox,
    setSelectionBox,
    isSelectingRef,
    startSelection,
    updateSelection,
    finishSelection,
    cancelSelection,
  };
}
