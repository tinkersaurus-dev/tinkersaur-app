import { create } from 'zustand';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';

/**
 * Canvas Instance Store
 *
 * Manages ephemeral UI state AND local editing state for a single canvas instance.
 * Each open diagram tab gets its own isolated store instance.
 *
 * CRITICAL: This is PER-INSTANCE state, not global state.
 * Multiple canvases can be open simultaneously with independent state.
 *
 * LOCAL EDITING PATTERN:
 * - localShapes/localConnectors are working copies for editing
 * - Changes are made to local state during interactions (drag, resize, etc.)
 * - Only committed to entity store when interaction completes (mouseup, save)
 * - This prevents hammering persistence layer on every mousemove
 */

export interface CanvasInstanceState {
  // Which diagram this store belongs to
  diagramId: string;

  // Local editing state (ephemeral working copy)
  localShapes: Shape[];
  localConnectors: Connector[];

  // Viewport state (ephemeral - never persisted)
  viewportZoom: number;
  viewportPanX: number;
  viewportPanY: number;

  // Interaction state
  selectedShapeIds: string[];
  hoveredShapeId: string | null;
  selectedConnectorIds: string[];
  hoveredConnectorId: string | null;
  isContextMenuOpen: boolean;
  contextMenuPosition: { x: number; y: number } | null;

  // Label editing state
  editingEntityId: string | null;
  editingEntityType: 'shape' | 'connector' | null;
  editingOriginalLabel: string | undefined;

  // Grid snapping
  gridSnappingEnabled: boolean;

  // Active connector type (ephemeral - for new connectors being drawn)
  activeConnectorType: string;

  // Content initialization
  initializeContent: (shapes: Shape[], connectors: Connector[]) => void;

  // Local shape operations (do NOT persist)
  updateLocalShape: (shapeId: string, updates: Partial<Shape>) => void;
  updateLocalShapes: (updates: Map<string, Partial<Shape>>) => void;
  addLocalShape: (shape: Shape) => void;
  removeLocalShape: (shapeId: string) => void;

  // Local connector operations
  updateLocalConnector: (connectorId: string, updates: Partial<Connector>) => void;
  addLocalConnector: (connector: Connector) => void;
  removeLocalConnector: (connectorId: string) => void;

  // Viewport actions
  setViewport: (zoom: number, panX: number, panY: number) => void;
  setSelectedShapes: (shapeIds: string[]) => void;
  setHoveredShapeId: (shapeId: string | null) => void;
  setSelectedConnectors: (connectorIds: string[]) => void;
  setSelection: (shapeIds: string[], connectorIds: string[]) => void;
  setHoveredConnectorId: (connectorId: string | null) => void;
  clearSelection: () => void;
  openContextMenu: (x: number, y: number) => void;
  closeContextMenu: () => void;
  setEditingEntity: (id: string, type: 'shape' | 'connector', originalLabel: string | undefined) => void;
  clearEditingEntity: () => void;
  setGridSnappingEnabled: (enabled: boolean) => void;
  setActiveConnectorType: (connectorType: string) => void;
  reset: () => void;
}

/**
 * Factory function that creates a NEW Zustand store instance for each diagram
 *
 * This ensures complete isolation between multiple open canvases.
 * Each call creates an independent store with its own state.
 */
export function createCanvasInstanceStore(diagramId: string, initialConnectorType = 'sequence-flow') {
  return create<CanvasInstanceState>((set) => ({
    // Initial state
    diagramId,
    localShapes: [],
    localConnectors: [],
    viewportZoom: 1,
    viewportPanX: 0,
    viewportPanY: 0,
    selectedShapeIds: [],
    hoveredShapeId: null,
    selectedConnectorIds: [],
    hoveredConnectorId: null,
    isContextMenuOpen: false,
    contextMenuPosition: null,
    editingEntityId: null,
    editingEntityType: null,
    editingOriginalLabel: undefined,
    gridSnappingEnabled: false,
    activeConnectorType: initialConnectorType,

    // Content initialization - load from entity store
    initializeContent: (shapes, connectors) =>
      set({
        localShapes: shapes,
        localConnectors: connectors,
      }),

    // Local shape operations (ephemeral, not persisted)
    updateLocalShape: (shapeId, updates) =>
      set((state) => ({
        localShapes: state.localShapes.map((shape) =>
          shape.id === shapeId ? { ...shape, ...updates } : shape
        ),
      })),

    updateLocalShapes: (updates) =>
      set((state) => ({
        localShapes: state.localShapes.map((shape) => {
          const shapeUpdates = updates.get(shape.id);
          return shapeUpdates ? { ...shape, ...shapeUpdates } : shape;
        }),
      })),

    addLocalShape: (shape) =>
      set((state) => ({
        localShapes: [...state.localShapes, shape],
      })),

    removeLocalShape: (shapeId) =>
      set((state) => ({
        localShapes: state.localShapes.filter((shape) => shape.id !== shapeId),
      })),

    // Local connector operations
    updateLocalConnector: (connectorId, updates) =>
      set((state) => ({
        localConnectors: state.localConnectors.map((connector) =>
          connector.id === connectorId ? { ...connector, ...updates } : connector
        ),
      })),

    addLocalConnector: (connector) =>
      set((state) => ({
        localConnectors: [...state.localConnectors, connector],
      })),

    removeLocalConnector: (connectorId) =>
      set((state) => ({
        localConnectors: state.localConnectors.filter((c) => c.id !== connectorId),
      })),

    // Viewport actions
    setViewport: (zoom, panX, panY) =>
      set({
        viewportZoom: zoom,
        viewportPanX: panX,
        viewportPanY: panY,
      }),

    // Selection actions
    setSelectedShapes: (shapeIds) =>
      set({
        selectedShapeIds: shapeIds,
        selectedConnectorIds: [], // Clear connector selection when selecting shapes
      }),

    setSelectedConnectors: (connectorIds) =>
      set({
        selectedConnectorIds: connectorIds,
        selectedShapeIds: [], // Clear shape selection when selecting connectors
      }),

    // New action for setting both shapes and connectors (used by selection box)
    setSelection: (shapeIds: string[], connectorIds: string[]) =>
      set({
        selectedShapeIds: shapeIds,
        selectedConnectorIds: connectorIds,
      }),

    clearSelection: () =>
      set({
        selectedShapeIds: [],
        selectedConnectorIds: [],
        editingEntityId: null,
        editingEntityType: null,
        editingOriginalLabel: undefined,
      }),

    // Hover actions
    setHoveredShapeId: (shapeId) =>
      set({
        hoveredShapeId: shapeId,
      }),

    setHoveredConnectorId: (connectorId) =>
      set({
        hoveredConnectorId: connectorId,
      }),

    // Context menu actions
    openContextMenu: (x, y) =>
      set({
        isContextMenuOpen: true,
        contextMenuPosition: { x, y },
      }),

    closeContextMenu: () =>
      set({
        isContextMenuOpen: false,
        contextMenuPosition: null,
      }),

    // Label editing actions
    setEditingEntity: (id, type, originalLabel) =>
      set({
        editingEntityId: id,
        editingEntityType: type,
        editingOriginalLabel: originalLabel,
      }),

    clearEditingEntity: () =>
      set({
        editingEntityId: null,
        editingEntityType: null,
        editingOriginalLabel: undefined,
      }),

    // Grid snapping actions
    setGridSnappingEnabled: (enabled) =>
      set({
        gridSnappingEnabled: enabled,
      }),

    // Active connector type actions
    setActiveConnectorType: (connectorType) =>
      set({
        activeConnectorType: connectorType,
      }),

    // Reset to initial state
    reset: () =>
      set({
        localShapes: [],
        localConnectors: [],
        viewportZoom: 1,
        viewportPanX: 0,
        viewportPanY: 0,
        selectedShapeIds: [],
        hoveredShapeId: null,
        selectedConnectorIds: [],
        hoveredConnectorId: null,
        isContextMenuOpen: false,
        contextMenuPosition: null,
        editingEntityId: null,
        editingEntityType: null,
        editingOriginalLabel: undefined,
        gridSnappingEnabled: false,
        activeConnectorType: initialConnectorType,
      }),
  }));
}

export type CanvasInstanceStore = ReturnType<typeof createCanvasInstanceStore>;
