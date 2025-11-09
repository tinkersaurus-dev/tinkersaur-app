import { useEffect } from 'react';

interface UseCanvasKeyboardHandlersProps {
  selectedConnectorIds: string[];
  deleteConnector?: (connectorId: string) => Promise<void>;
  setSelectedConnectors: (connectorIds: string[]) => void;
}

/**
 * Hook for managing keyboard interactions on the canvas
 * Currently handles Delete key for selected connectors
 */
export function useCanvasKeyboardHandlers({
  selectedConnectorIds,
  deleteConnector,
  setSelectedConnectors,
}: UseCanvasKeyboardHandlersProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in an input field
      const target = event.target as Element;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable)) {
        return;
      }

      // Delete selected connectors
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedConnectorIds.length > 0 && deleteConnector) {
        event.preventDefault();
        // Delete all selected connectors
        selectedConnectorIds.forEach((connectorId) => {
          deleteConnector(connectorId);
        });
        // Clear selection after deletion
        setSelectedConnectors([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConnectorIds, deleteConnector, setSelectedConnectors]);
}
