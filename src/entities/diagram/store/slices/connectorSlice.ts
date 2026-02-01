import type { CreateConnectorDTO, Connector } from '@/entities/connector';
import { diagramApi } from '@/entities/diagram';
import { commandManager } from '@/features/canvas-commands/model/CommandManager';
import { handleStoreError } from '../utils/errorHandler';
import { syncConnectorToCanvas, syncConnectorsToCanvas } from '../utils/canvasSync';
import type { DiagramSlice, ConnectorSlice } from '../types';

/**
 * Connector operations slice - public and internal methods for connector CRUD.
 *
 * Public methods create commands and execute via commandManager.
 * Internal methods are the command executors (called by commands for undo/redo).
 */
export const createConnectorSlice: DiagramSlice<ConnectorSlice> = (set, get) => ({
  // ============================================================================
  // Public methods (wrapped in commands)
  // ============================================================================

  addConnector: async (diagramId: string, connector: CreateConnectorDTO) => {
    try {
      // Create and execute command
      const command = get().commandFactory.createAddConnector(diagramId, connector);
      await commandManager.execute(command, diagramId);

      // Refresh activation boxes and lifeline heights for sequence diagrams
      const diagram = get().diagrams[diagramId];
      if (diagram?.type === 'sequence' && connector.type.startsWith('sequence-')) {
        // Calculate and update lifeline heights first
        const { calculateRequiredLifelineHeight } = await import(
          '@/features/diagram-rendering/sequence/heightCalculator'
        );
        const requiredHeight = calculateRequiredLifelineHeight(
          diagram.shapes,
          diagram.connectors || []
        );
        const heightCommand = get().commandFactory.createUpdateLifelineHeights(
          diagramId,
          requiredHeight
        );
        await commandManager.execute(heightCommand, diagramId);

        // Then refresh activation boxes
        const refreshCommand = get().commandFactory.createRefreshSequenceActivations(diagramId);
        await commandManager.execute(refreshCommand, diagramId);
      }
    } catch (error) {
      handleStoreError(error, set, diagramId, 'Failed to add connector');
    }
  },

  updateConnectorLabel: async (diagramId: string, connectorId: string, newLabel: string) => {
    try {
      // Get current connector to capture old label
      const currentConnector = await get()._internalGetConnector(diagramId, connectorId);
      if (!currentConnector) {
        throw new Error(`Connector ${connectorId} not found`);
      }

      // Create and execute command
      const command = get().commandFactory.createUpdateConnectorLabel(
        diagramId,
        connectorId,
        currentConnector.label,
        newLabel
      );
      await commandManager.execute(command, diagramId);
    } catch (error) {
      handleStoreError(error, set, diagramId, 'Failed to update connector label');
    }
  },

  deleteConnector: async (diagramId: string, connectorId: string) => {
    try {
      // Check if this is a sequence diagram before deleting
      const diagram = get().diagrams[diagramId];
      const isSequenceDiagram = diagram?.type === 'sequence';

      // Create and execute command
      const command = get().commandFactory.createDeleteConnector(diagramId, connectorId);
      await commandManager.execute(command, diagramId);

      // Refresh activation boxes and lifeline heights for sequence diagrams
      if (isSequenceDiagram) {
        // Get updated diagram after deletion
        const updatedDiagram = get().diagrams[diagramId];
        if (updatedDiagram) {
          // Calculate and update lifeline heights first
          const { calculateRequiredLifelineHeight } = await import(
            '@/features/diagram-rendering/sequence/heightCalculator'
          );
          const requiredHeight = calculateRequiredLifelineHeight(
            updatedDiagram.shapes,
            updatedDiagram.connectors || []
          );
          const heightCommand = get().commandFactory.createUpdateLifelineHeights(
            diagramId,
            requiredHeight
          );
          await commandManager.execute(heightCommand, diagramId);

          // Then refresh activation boxes
          const refreshCommand = get().commandFactory.createRefreshSequenceActivations(diagramId);
          await commandManager.execute(refreshCommand, diagramId);
        }
      }
    } catch (error) {
      handleStoreError(error, set, diagramId, 'Failed to delete connector');
    }
  },

  deleteConnectors: async (diagramId: string, connectorIds: string[]) => {
    try {
      // Create and execute batch delete command (single undo operation)
      const command = get().commandFactory.createBatchDeleteConnectors(diagramId, connectorIds);
      await commandManager.execute(command, diagramId);
    } catch (error) {
      handleStoreError(error, set, diagramId, 'Failed to delete connectors');
    }
  },

  // ============================================================================
  // Internal methods (used by commands, not wrapped)
  // ============================================================================

  _internalAddConnector: async (diagramId: string, connector: CreateConnectorDTO) => {
    const updatedDiagram = await diagramApi.addConnector(diagramId, connector);

    if (!updatedDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    set((state) => ({
      diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
    }));

    // Update canvas instance local state
    if (updatedDiagram.connectors.length > 0) {
      const newConnector = updatedDiagram.connectors[updatedDiagram.connectors.length - 1];
      syncConnectorToCanvas(diagramId, 'add', newConnector);
    }

    return updatedDiagram;
  },

  _internalAddConnectorsBatch: async (diagramId: string, connectors: CreateConnectorDTO[]) => {
    // Add all connectors sequentially to the API but only trigger one set() at the end
    let currentDiagram = get().diagrams[diagramId];
    if (!currentDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    for (const connector of connectors) {
      const updatedDiagram = await diagramApi.addConnector(diagramId, connector);
      if (!updatedDiagram) {
        throw new Error(`Failed to add connector to diagram ${diagramId}`);
      }
      currentDiagram = updatedDiagram;
    }

    // Single set() call at the end
    set((state) => ({
      diagrams: { ...state.diagrams, [diagramId]: currentDiagram },
    }));

    // Update canvas instance with all new connectors
    const startIndex = currentDiagram.connectors.length - connectors.length;
    const newConnectors = currentDiagram.connectors.slice(startIndex);
    syncConnectorsToCanvas(diagramId, 'add', newConnectors);

    return currentDiagram;
  },

  _internalUpdateConnector: async (
    diagramId: string,
    connectorId: string,
    updates: Partial<Connector>
  ) => {
    const updatedDiagram = await diagramApi.updateConnector(diagramId, connectorId, updates);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
      }));
    }

    return updatedDiagram;
  },

  _internalDeleteConnector: async (diagramId: string, connectorId: string) => {
    const updatedDiagram = await diagramApi.deleteConnector(diagramId, connectorId);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
      }));

      // Update canvas instance local state
      syncConnectorToCanvas(diagramId, 'remove', connectorId);
    }

    return updatedDiagram;
  },

  _internalRestoreConnector: async (diagramId: string, connector: Connector) => {
    const updatedDiagram = await diagramApi.restoreConnector(diagramId, connector);

    if (!updatedDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    set((state) => ({
      diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
    }));

    // Update canvas instance local state
    syncConnectorToCanvas(diagramId, 'add', connector);

    return updatedDiagram;
  },

  _internalGetConnector: async (diagramId: string, connectorId: string) => {
    const diagram = get().diagrams[diagramId];
    if (!diagram) {
      return null;
    }

    const connector = diagram.connectors.find((c: Connector) => c.id === connectorId);
    return connector ?? null;
  },

  _internalDeleteConnectorsBatch: async (diagramId: string, connectorIds: string[]) => {
    if (connectorIds.length === 0) {
      return get().diagrams[diagramId] ?? null;
    }

    const updatedDiagram = await diagramApi.deleteConnectorsByIds(diagramId, connectorIds);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
      }));

      // Update canvas instance local state - remove all connectors at once
      syncConnectorsToCanvas(diagramId, 'remove', connectorIds);
    }

    return updatedDiagram;
  },

  _internalRestoreConnectorsBatch: async (diagramId: string, connectors: Connector[]) => {
    if (connectors.length === 0) {
      return get().diagrams[diagramId] ?? null;
    }

    const updatedDiagram = await diagramApi.restoreConnectors(diagramId, connectors);

    if (!updatedDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    set((state) => ({
      diagrams: { ...state.diagrams, [diagramId]: updatedDiagram },
    }));

    // Update canvas instance local state - add all connectors at once
    syncConnectorsToCanvas(diagramId, 'add', connectors);

    return updatedDiagram;
  },
});
