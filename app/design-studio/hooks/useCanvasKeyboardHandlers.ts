import { useEffect } from 'react';

interface UseCanvasKeyboardHandlersProps {
  selectedConnectorIds: string[];
  selectedShapeIds: string[];
  deleteConnector?: (connectorId: string) => Promise<void>;
  deleteShape?: (shapeId: string) => Promise<void>;
  setSelectedConnectors: (connectorIds: string[]) => void;
  setSelectedShapes: (shapeIds: string[]) => void;
}

/**
 * Hook for managing keyboard interactions on the canvas
 * Handles Delete/Backspace key for selected shapes and connectors
 */
export function useCanvasKeyboardHandlers({
  selectedConnectorIds,
  selectedShapeIds,
  deleteConnector,
  deleteShape,
  setSelectedConnectors,
  setSelectedShapes,
}: UseCanvasKeyboardHandlersProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in an input field
      const target = event.target as Element;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable)) {
        return;
      }

      // Delete selected shapes and connectors
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();

        // Delete all selected shapes
        if (selectedShapeIds.length > 0 && deleteShape) {
          selectedShapeIds.forEach((shapeId) => {
            deleteShape(shapeId);
          });
          // Clear shape selection after deletion
          setSelectedShapes([]);
        }

        // Delete all selected connectors
        if (selectedConnectorIds.length > 0 && deleteConnector) {
          selectedConnectorIds.forEach((connectorId) => {
            deleteConnector(connectorId);
          });
          // Clear connector selection after deletion
          setSelectedConnectors([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConnectorIds, selectedShapeIds, deleteConnector, deleteShape, setSelectedConnectors, setSelectedShapes]);
}
