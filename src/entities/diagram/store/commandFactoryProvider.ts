import { CommandFactory, type CommandFactoryDependencies } from '@/features/canvas-commands/model/CommandFactory';
import { canvasInstanceRegistry } from '@/app/model/stores/canvas/canvasInstanceRegistry';
import type { Connector } from '@/entities/connector';
import type { DiagramStoreState } from './types';

/**
 * Creates CommandFactory dependencies with lazy store access.
 * Uses getState() for lazy evaluation to avoid circular dependencies
 * and ensure methods are called with current state.
 */
function createCommandFactoryDependencies(
  getState: () => DiagramStoreState
): CommandFactoryDependencies {
  return {
    // Shape functions - lazy via getState()
    _internalAddShape: (diagramId, shape) => getState()._internalAddShape(diagramId, shape),
    _internalDeleteShape: (diagramId, shapeId) =>
      getState()._internalDeleteShape(diagramId, shapeId),
    _internalUpdateShape: (diagramId, shapeId, updates) =>
      getState()._internalUpdateShape(diagramId, shapeId, updates),
    _internalUpdateShapes: (diagramId, updates) =>
      getState()._internalUpdateShapes(diagramId, updates),
    _internalRestoreShape: (diagramId, shape) =>
      getState()._internalRestoreShape(diagramId, shape),
    _internalGetShape: (diagramId, shapeId) => getState()._internalGetShape(diagramId, shapeId),

    // Connector functions - lazy via getState()
    _internalAddConnector: (diagramId, connector) =>
      getState()._internalAddConnector(diagramId, connector),
    _internalDeleteConnector: (diagramId, connectorId) =>
      getState()._internalDeleteConnector(diagramId, connectorId),
    _internalUpdateConnector: (diagramId, connectorId, updates) =>
      getState()._internalUpdateConnector(diagramId, connectorId, updates),
    _internalRestoreConnector: (diagramId, connector) =>
      getState()._internalRestoreConnector(diagramId, connector),
    _internalGetConnector: (diagramId, connectorId) =>
      getState()._internalGetConnector(diagramId, connectorId),

    // Batch operations - lazy via getState()
    _internalDeleteConnectorsBatch: (diagramId, connectorIds) =>
      getState()._internalDeleteConnectorsBatch(diagramId, connectorIds),
    _internalRestoreConnectorsBatch: (diagramId, connectors) =>
      getState()._internalRestoreConnectorsBatch(diagramId, connectors),
    _internalDeleteShapesBatch: (diagramId, shapeIds) =>
      getState()._internalDeleteShapesBatch(diagramId, shapeIds),
    _internalRestoreShapesBatch: (diagramId, shapes) =>
      getState()._internalRestoreShapesBatch(diagramId, shapes),

    // Diagram access
    getDiagram: (diagramId) => getState().diagrams[diagramId] ?? null,

    // Canvas instance accessors for local state updates
    getUpdateLocalShape: (diagramId) => {
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      return canvasInstance.getState().updateLocalShape;
    },
    getUpdateLocalConnector: (diagramId) => {
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      return canvasInstance.getState().updateLocalConnector;
    },

    // Current connector lookup for command usage
    getCurrentConnector: (diagramId, connectorId) => {
      const diagram = getState().diagrams[diagramId];
      if (!diagram) return null;
      return diagram.connectors.find((c: Connector) => c.id === connectorId) ?? null;
    },
  };
}

/**
 * Creates a CommandFactory instance with lazy access to store methods.
 * This is the factory initialization pattern that avoids circular dependencies.
 */
export function createCommandFactory(getState: () => DiagramStoreState): CommandFactory {
  const deps = createCommandFactoryDependencies(getState);
  return new CommandFactory(deps);
}
