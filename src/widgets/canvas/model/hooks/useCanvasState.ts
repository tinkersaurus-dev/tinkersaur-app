/**
 * Canvas State Hook
 *
 * Encapsulates all Zustand store interactions and state initialization for a canvas instance.
 * Provides a clean interface for accessing diagram data, local editing state, and store actions.
 *
 * This hook consolidates:
 * - Diagram loading via useDiagram
 * - Canvas instance store selectors and actions
 * - CRUD operations via useDiagramCRUD
 * - Viewport transform
 * - Command factory
 * - Local/entity state resolution
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useCanvasInstance } from '@/features/diagram-rendering/useCanvasInstance';
import { useDiagram, useDiagramCRUD } from '@/features/diagram-management';
import { useDiagramStore } from '@/entities/diagram/store/useDiagramStore';
import { useViewportTransform } from '../../lib/hooks/useViewportTransform';
import type { Shape } from '@/entities/shape';
import type { Connector } from '@/entities/connector';
import type { Diagram } from '@/entities/diagram';
import type { ViewportTransform } from '../../lib/utils/viewport';
import type { CommandFactory } from '@/features/canvas-commands/model/CommandFactory';

export interface UseCanvasStateProps {
  diagramId: string;
}

export interface CanvasStateStoreActions {
  setSelectedShapes: (ids: string[]) => void;
  setHoveredShapeId: (id: string | null) => void;
  setSelectedConnectors: (ids: string[]) => void;
  setSelection: (shapeIds: string[], connectorIds: string[]) => void;
  setHoveredConnectorId: (id: string | null) => void;
  setHoveredContainerId: (id: string | null) => void;
  clearSelection: () => void;
  initializeContent: (shapes: Shape[], connectors: Connector[]) => void;
  updateLocalShape: (id: string, updates: Partial<Shape>) => void;
  updateLocalShapes: (updates: Map<string, Partial<Shape>>) => void;
  updateLocalConnector: (id: string, updates: Partial<Connector>) => void;
  setEditingEntity: (id: string, type: 'shape' | 'connector', label: string | undefined) => void;
  clearEditingEntity: () => void;
  setGridSnappingEnabled: (enabled: boolean) => void;
  setGridDisplayMode: (mode: 'dots' | 'lines') => void;
  setActiveConnectorType: (type: string) => void;
}

export interface CanvasStateCrudOperations {
  addShape: ((shape: Parameters<NonNullable<ReturnType<typeof useDiagramCRUD>['addShape']>>[0]) => Promise<string>) | undefined;
  updateShapes: ReturnType<typeof useDiagramCRUD>['updateShapes'];
  addConnector: ReturnType<typeof useDiagramCRUD>['addConnector'];
  deleteConnector: ReturnType<typeof useDiagramCRUD>['deleteConnector'];
  deleteShape: ReturnType<typeof useDiagramCRUD>['deleteShape'];
  deleteConnectors: ReturnType<typeof useDiagramCRUD>['deleteConnectors'];
  deleteShapes: ReturnType<typeof useDiagramCRUD>['deleteShapes'];
  updateShapeLabel: (diagramId: string, shapeId: string, label: string) => Promise<void>;
  updateConnectorLabel: (diagramId: string, connectorId: string, label: string) => Promise<void>;
}

export interface UseCanvasStateReturn {
  // Diagram data
  diagram: Diagram | undefined;
  loading: boolean;

  // Rendered content (local state with entity fallback)
  shapes: Shape[];
  connectors: Connector[];

  // Entity shapes/connectors (persisted)
  entityShapes: Shape[];
  entityConnectors: Connector[];

  // Local state from instance store
  localShapes: Shape[];
  localConnectors: Connector[];

  // Selection state
  selectedShapeIds: string[];
  hoveredShapeId: string | null;
  selectedConnectorIds: string[];
  hoveredConnectorId: string | null;
  hoveredContainerId: string | null;

  // Editing state
  editingEntityId: string | null;
  editingEntityType: 'shape' | 'connector' | null;
  editingOriginalLabel: string | undefined;

  // Settings
  gridSnappingEnabled: boolean;
  gridDisplayMode: 'dots' | 'lines';
  activeConnectorType: string;

  // Viewport transform
  viewportTransform: ViewportTransform;

  // Store actions (passed through for other hooks)
  storeActions: CanvasStateStoreActions;

  // CRUD operations
  crudOperations: CanvasStateCrudOperations;

  // Command factory for creating commands
  commandFactory: CommandFactory;

  // Helper to get shape by ID
  getShape: (shapeId: string) => Shape | undefined;
}

export function useCanvasState({ diagramId }: UseCanvasStateProps): UseCanvasStateReturn {
  // Track if local state has been initialized from entity store (ref to avoid setState in effect)
  const isInitializedRef = useRef(false);

  // Get persisted canvas data from entity store (need diagram type early for store initialization)
  const { diagram, loading } = useDiagram(diagramId);

  // Get isolated instance store for THIS diagram
  const canvasInstance = useCanvasInstance(diagramId, diagram?.type);

  // Get viewport transform (bundles zoom, panX, panY with transformation methods)
  const viewportTransform = useViewportTransform(canvasInstance);

  // Get instance-specific state
  const selectedShapeIds = canvasInstance((state) => state.selectedShapeIds);
  const hoveredShapeId = canvasInstance((state) => state.hoveredShapeId);
  const selectedConnectorIds = canvasInstance((state) => state.selectedConnectorIds);
  const hoveredConnectorId = canvasInstance((state) => state.hoveredConnectorId);
  const hoveredContainerId = canvasInstance((state) => state.hoveredContainerId);
  const gridSnappingEnabled = canvasInstance((state) => state.gridSnappingEnabled);
  const gridDisplayMode = canvasInstance((state) => state.gridDisplayMode);

  // Get LOCAL editing state (ephemeral, not persisted until commit)
  const localShapes = canvasInstance((state) => state.localShapes);
  const localConnectors = canvasInstance((state) => state.localConnectors);
  const editingEntityId = canvasInstance((state) => state.editingEntityId);
  const editingEntityType = canvasInstance((state) => state.editingEntityType);
  const editingOriginalLabel = canvasInstance((state) => state.editingOriginalLabel);

  // Get instance actions
  const setSelectedShapes = canvasInstance((state) => state.setSelectedShapes);
  const setHoveredShapeId = canvasInstance((state) => state.setHoveredShapeId);
  const setSelectedConnectors = canvasInstance((state) => state.setSelectedConnectors);
  const setSelection = canvasInstance((state) => state.setSelection);
  const setHoveredConnectorId = canvasInstance((state) => state.setHoveredConnectorId);
  const setHoveredContainerId = canvasInstance((state) => state.setHoveredContainerId);
  const clearSelection = canvasInstance((state) => state.clearSelection);
  const initializeContent = canvasInstance((state) => state.initializeContent);
  const updateLocalShape = canvasInstance((state) => state.updateLocalShape);
  const updateLocalShapes = canvasInstance((state) => state.updateLocalShapes);
  const updateLocalConnector = canvasInstance((state) => state.updateLocalConnector);
  const setEditingEntity = canvasInstance((state) => state.setEditingEntity);
  const clearEditingEntity = canvasInstance((state) => state.clearEditingEntity);
  const setGridSnappingEnabled = canvasInstance((state) => state.setGridSnappingEnabled);
  const setGridDisplayMode = canvasInstance((state) => state.setGridDisplayMode);
  const activeConnectorType = canvasInstance((state) => state.activeConnectorType);
  const setActiveConnectorType = canvasInstance((state) => state.setActiveConnectorType);

  // Get CRUD operations for this diagram
  const { addShape, updateShapes, addConnector, deleteConnector, deleteShape, deleteConnectors, deleteShapes } = useDiagramCRUD(diagramId);
  const commandFactory = useDiagramStore((state) => state.commandFactory);
  const updateShapeLabel = useDiagramStore((state) => state.updateShapeLabel);
  const updateConnectorLabel = useDiagramStore((state) => state.updateConnectorLabel);

  // Entity shapes/connectors from diagram
  const entityShapes = useMemo(() => diagram?.shapes || [], [diagram?.shapes]);
  const entityConnectors = useMemo(() => diagram?.connectors || [], [diagram?.connectors]);

  // Track lengths to avoid unnecessary effect re-runs from array reference changes
  const entityShapesLength = entityShapes.length;
  const entityConnectorsLength = entityConnectors.length;

  // Initialize local content from entity store on FIRST mount only
  // Local edits sync via canvasSync.ts, so we don't need to re-initialize on every diagram update
  // Re-initialization would cause flickering by replacing local state mid-edit
  useEffect(() => {
    if (!loading && diagram && !isInitializedRef.current) {
      const hasContent = entityShapesLength > 0 || entityConnectorsLength > 0;
      if (hasContent) {
        // Initialize synchronously to avoid flicker from requestAnimationFrame delay
        initializeContent(entityShapes, entityConnectors);
        isInitializedRef.current = true;
      }
    }
  }, [loading, diagram, entityShapesLength, entityConnectorsLength, initializeContent, entityShapes, entityConnectors]);

  // Render from local state (working copy), fallback to entity state if local not initialized
  const shapes = useMemo(
    () => (localShapes.length > 0 ? localShapes : entityShapes),
    [localShapes, entityShapes]
  );
  const connectors = useMemo(
    () => (localConnectors.length > 0 ? localConnectors : entityConnectors),
    [localConnectors, entityConnectors]
  );

  // Helper function to get a shape by ID from local shapes
  const getShape = useCallback(
    (shapeId: string) => {
      return localShapes.find((s) => s.id === shapeId);
    },
    [localShapes]
  );

  // Bundle store actions
  const storeActions: CanvasStateStoreActions = useMemo(() => ({
    setSelectedShapes,
    setHoveredShapeId,
    setSelectedConnectors,
    setSelection,
    setHoveredConnectorId,
    setHoveredContainerId,
    clearSelection,
    initializeContent,
    updateLocalShape,
    updateLocalShapes,
    updateLocalConnector,
    setEditingEntity,
    clearEditingEntity,
    setGridSnappingEnabled,
    setGridDisplayMode,
    setActiveConnectorType,
  }), [
    setSelectedShapes,
    setHoveredShapeId,
    setSelectedConnectors,
    setSelection,
    setHoveredConnectorId,
    setHoveredContainerId,
    clearSelection,
    initializeContent,
    updateLocalShape,
    updateLocalShapes,
    updateLocalConnector,
    setEditingEntity,
    clearEditingEntity,
    setGridSnappingEnabled,
    setGridDisplayMode,
    setActiveConnectorType,
  ]);

  // Bundle CRUD operations
  const crudOperations: CanvasStateCrudOperations = useMemo(() => ({
    addShape,
    updateShapes,
    addConnector,
    deleteConnector,
    deleteShape,
    deleteConnectors,
    deleteShapes,
    updateShapeLabel,
    updateConnectorLabel,
  }), [
    addShape,
    updateShapes,
    addConnector,
    deleteConnector,
    deleteShape,
    deleteConnectors,
    deleteShapes,
    updateShapeLabel,
    updateConnectorLabel,
  ]);

  return {
    // Diagram data
    diagram,
    loading,

    // Rendered content
    shapes,
    connectors,

    // Entity shapes/connectors
    entityShapes,
    entityConnectors,

    // Local state
    localShapes,
    localConnectors,

    // Selection state
    selectedShapeIds,
    hoveredShapeId,
    selectedConnectorIds,
    hoveredConnectorId,
    hoveredContainerId,

    // Editing state
    editingEntityId,
    editingEntityType,
    editingOriginalLabel,

    // Settings
    gridSnappingEnabled,
    gridDisplayMode,
    activeConnectorType,

    // Viewport transform
    viewportTransform,

    // Store actions
    storeActions,

    // CRUD operations
    crudOperations,

    // Command factory
    commandFactory,

    // Helper
    getShape,
  };
}
