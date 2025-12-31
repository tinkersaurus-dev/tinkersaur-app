import { useCallback } from 'react';

interface UseConnectorInteractionProps {
  // Selection state management
  selectedConnectorIds: string[];
  setSelectedConnectors: (connectorIds: string[]) => void;

  // Hover state management
  setHoveredConnectorId: (connectorId: string | null) => void;

  // Optional right-click handler for context menu
  onConnectorRightClick?: (connectorId: string, screenX: number, screenY: number) => void;
}

interface UseConnectorInteractionReturn {
  handleConnectorMouseDown: (e: React.MouseEvent, connectorId: string) => void;
  handleConnectorMouseEnter: (e: React.MouseEvent, connectorId: string) => void;
  handleConnectorMouseLeave: (e: React.MouseEvent, connectorId: string) => void;
}

/**
 * Hook for managing connector interaction (selection and hover)
 *
 * Handles:
 * - Single and multi-select with modifier keys (Shift/Ctrl/Cmd)
 * - Hover state tracking
 * - Right-click context menu trigger
 * - Event propagation control
 *
 * @param props - Configuration for connector interaction
 * @returns Event handlers for connector mouse events
 */
export function useConnectorInteraction({
  selectedConnectorIds,
  setSelectedConnectors,
  setHoveredConnectorId,
  onConnectorRightClick,
}: UseConnectorInteractionProps): UseConnectorInteractionReturn {

  // Handle connector mouse down for selection
  const handleConnectorMouseDown = useCallback(
    (e: React.MouseEvent, connectorId: string) => {
      e.stopPropagation();

      // Handle right-click for context menu
      if (e.button === 2) {
        e.preventDefault();
        onConnectorRightClick?.(connectorId, e.clientX, e.clientY);
        return;
      }

      // Only handle left mouse button for selection
      if (e.button !== 0) return;

      // Check for multi-select modifiers (Shift, Ctrl, or Cmd on Mac)
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;

      if (isMultiSelect) {
        // Toggle connector in selection
        if (selectedConnectorIds.includes(connectorId)) {
          // Remove from selection
          setSelectedConnectors(selectedConnectorIds.filter((id) => id !== connectorId));
        } else {
          // Add to selection
          setSelectedConnectors([...selectedConnectorIds, connectorId]);
        }
      } else {
        // If clicking on a non-selected connector, select only that connector
        if (!selectedConnectorIds.includes(connectorId)) {
          setSelectedConnectors([connectorId]);
        }
        // If clicking on an already selected connector, keep the current selection
      }
    },
    [selectedConnectorIds, setSelectedConnectors, onConnectorRightClick]
  );

  // Handle connector mouse enter for hover state
  const handleConnectorMouseEnter = useCallback(
    (_e: React.MouseEvent, connectorId: string) => {
      setHoveredConnectorId(connectorId);
    },
    [setHoveredConnectorId]
  );

  // Handle connector mouse leave for hover state
  const handleConnectorMouseLeave = useCallback(
    (_e: React.MouseEvent, _connectorId: string) => {
      setHoveredConnectorId(null);
    },
    [setHoveredConnectorId]
  );

  return {
    handleConnectorMouseDown,
    handleConnectorMouseEnter,
    handleConnectorMouseLeave,
  };
}
