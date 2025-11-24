import { createContext, useContext } from 'react';
import type { InteractionMode, SelectionBox, DrawingConnector } from '../../../hooks/useInteractionState';

/**
 * Canvas Selection Context
 *
 * Provides selection state, interaction modes, and editing state for the Canvas component.
 * This context handles which entities are selected, hovered, being edited, and the current interaction mode.
 */
export interface CanvasSelectionContext {
  // Selection State
  selectedShapeIds: string[];
  hoveredShapeId: string | null;
  selectedConnectorIds: string[];
  hoveredConnectorId: string | null;
  hoveredContainerId: string | null; // Container being hovered during drag

  // Interaction State
  mode: InteractionMode;
  selectionBox: SelectionBox | null;
  drawingConnector: DrawingConnector | null;

  // Editing State
  editingEntityId: string | null;
  editingEntityType: 'shape' | 'connector' | null;
  gridSnappingEnabled: boolean;
  gridDisplayMode: 'dots' | 'lines';
  activeConnectorType: string;
}

/**
 * React Context for Canvas Selection
 */
export const SelectionContext = createContext<CanvasSelectionContext | null>(null);

/**
 * Hook to consume Canvas Selection context
 *
 * @throws Error if used outside of CanvasSelectionContext provider
 * @returns Canvas selection context with selection and interaction state
 */
export function useCanvasSelection(): CanvasSelectionContext {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useCanvasSelection must be used within a CanvasSelectionContext provider');
  }
  return context;
}
