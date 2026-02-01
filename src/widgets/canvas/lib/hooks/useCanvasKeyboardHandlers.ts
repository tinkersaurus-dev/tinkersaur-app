import { useEffect } from 'react';

interface UseCanvasKeyboardHandlersProps {
  selectedConnectorIds: string[];
  selectedShapeIds: string[];
  deleteConnector?: (connectorId: string) => Promise<void>;
  deleteShape?: (shapeId: string) => Promise<void>;
  deleteConnectors?: (connectorIds: string[]) => Promise<void>;
  deleteShapes?: (shapeIds: string[]) => Promise<void>;
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
  deleteConnectors,
  deleteShapes,
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

        // Delete all selected shapes (batch delete if multiple, single if one)
        if (selectedShapeIds.length > 0) {
          if (selectedShapeIds.length > 1 && deleteShapes) {
            // Use batch delete for multiple shapes (single undo operation)
            deleteShapes(selectedShapeIds);
          } else if (deleteShape) {
            // Use single delete for one shape
            deleteShape(selectedShapeIds[0]);
          }
          // Clear shape selection after deletion
          setSelectedShapes([]);
        }

        // Delete all selected connectors (batch delete if multiple, single if one)
        if (selectedConnectorIds.length > 0) {
          if (selectedConnectorIds.length > 1 && deleteConnectors) {
            // Use batch delete for multiple connectors (single undo operation)
            deleteConnectors(selectedConnectorIds);
          } else if (deleteConnector) {
            // Use single delete for one connector
            deleteConnector(selectedConnectorIds[0]);
          }
          // Clear connector selection after deletion
          setSelectedConnectors([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConnectorIds, selectedShapeIds, deleteConnector, deleteShape, deleteConnectors, deleteShapes, setSelectedConnectors, setSelectedShapes]);
}
