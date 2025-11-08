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
  hasUnsavedChanges: boolean;

  // Viewport state (ephemeral - never persisted)
  viewportZoom: number;
  viewportPanX: number;
  viewportPanY: number;

  // Interaction state
  selectedShapeIds: string[];
  hoveredShapeId: string | null;
  activeTool: 'select' | 'pan';
  isDragging: boolean;
  isContextMenuOpen: boolean;
  contextMenuPosition: { x: number; y: number } | null;

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

  // Dirty state management
  markDirty: () => void;
  markClean: () => void;

  // Viewport actions
  setViewport: (zoom: number, panX: number, panY: number) => void;
  setSelectedShapes: (shapeIds: string[]) => void;
  setHoveredShapeId: (shapeId: string | null) => void;
  setTool: (tool: 'select' | 'pan') => void;
  clearSelection: () => void;
  setIsDragging: (dragging: boolean) => void;
  openContextMenu: (x: number, y: number) => void;
  closeContextMenu: () => void;
  reset: () => void;
}

/**
 * Factory function that creates a NEW Zustand store instance for each diagram
 *
 * This ensures complete isolation between multiple open canvases.
 * Each call creates an independent store with its own state.
 */
export function createCanvasInstanceStore(diagramId: string) {
  return create<CanvasInstanceState>((set) => ({
    // Initial state
    diagramId,
    localShapes: [],
    localConnectors: [],
    hasUnsavedChanges: false,
    viewportZoom: 1,
    viewportPanX: 0,
    viewportPanY: 0,
    selectedShapeIds: [],
    hoveredShapeId: null,
    activeTool: 'pan',
    isDragging: false,
    isContextMenuOpen: false,
    contextMenuPosition: null,

    // Content initialization - load from entity store
    initializeContent: (shapes, connectors) =>
      set({
        localShapes: shapes,
        localConnectors: connectors,
        hasUnsavedChanges: false,
      }),

    // Local shape operations (ephemeral, not persisted)
    updateLocalShape: (shapeId, updates) =>
      set((state) => ({
        localShapes: state.localShapes.map((shape) =>
          shape.id === shapeId ? { ...shape, ...updates } : shape
        ),
        hasUnsavedChanges: true,
      })),

    updateLocalShapes: (updates) =>
      set((state) => ({
        localShapes: state.localShapes.map((shape) => {
          const shapeUpdates = updates.get(shape.id);
          return shapeUpdates ? { ...shape, ...shapeUpdates } : shape;
        }),
        hasUnsavedChanges: true,
      })),

    addLocalShape: (shape) =>
      set((state) => ({
        localShapes: [...state.localShapes, shape],
        hasUnsavedChanges: true,
      })),

    removeLocalShape: (shapeId) =>
      set((state) => ({
        localShapes: state.localShapes.filter((shape) => shape.id !== shapeId),
        hasUnsavedChanges: true,
      })),

    // Local connector operations
    updateLocalConnector: (connectorId, updates) =>
      set((state) => ({
        localConnectors: state.localConnectors.map((connector) =>
          connector.id === connectorId ? { ...connector, ...updates } : connector
        ),
        hasUnsavedChanges: true,
      })),

    addLocalConnector: (connector) =>
      set((state) => ({
        localConnectors: [...state.localConnectors, connector],
        hasUnsavedChanges: true,
      })),

    removeLocalConnector: (connectorId) =>
      set((state) => ({
        localConnectors: state.localConnectors.filter((c) => c.id !== connectorId),
        hasUnsavedChanges: true,
      })),

    // Dirty state management
    markDirty: () => set({ hasUnsavedChanges: true }),
    markClean: () => set({ hasUnsavedChanges: false }),

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
      }),

    clearSelection: () =>
      set({
        selectedShapeIds: [],
      }),

    // Hover actions
    setHoveredShapeId: (shapeId) =>
      set({
        hoveredShapeId: shapeId,
      }),

    // Tool actions
    setTool: (tool) =>
      set({
        activeTool: tool,
      }),

    // Drag state
    setIsDragging: (dragging) =>
      set({
        isDragging: dragging,
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

    // Reset to initial state
    reset: () =>
      set({
        localShapes: [],
        localConnectors: [],
        hasUnsavedChanges: false,
        viewportZoom: 1,
        viewportPanX: 0,
        viewportPanY: 0,
        selectedShapeIds: [],
        hoveredShapeId: null,
        activeTool: 'pan',
        isDragging: false,
        isContextMenuOpen: false,
        contextMenuPosition: null,
      }),
  }));
}

export type CanvasInstanceStore = ReturnType<typeof createCanvasInstanceStore>;
