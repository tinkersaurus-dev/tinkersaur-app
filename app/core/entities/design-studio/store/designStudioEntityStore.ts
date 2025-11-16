import { create } from 'zustand';
import type {
  DesignWork,
  CreateDesignWorkDto,
  Diagram,
  CreateDiagramDto,
  Interface,
  CreateInterfaceDto,
  Document,
  CreateDocumentDto,
  CreateShapeDTO,
  Shape,
} from '../types';
import type { CreateConnectorDTO, Connector } from '../types/Connector';
import { designWorkApi, diagramApi, interfaceApi, documentApi, initializeMockData } from '../api';
import { commandManager } from '~/core/commands/CommandManager';
import { CommandFactory, type CommandFactoryDependencies as _CommandFactoryDependencies } from '~/core/commands/CommandFactory';
import { canvasInstanceRegistry } from '~/design-studio/store/content/canvasInstanceRegistry';

interface DesignStudioEntityStore {
  // Command factory for centralized command creation
  commandFactory: CommandFactory;
  // Entity state - now using Records for lazy loading
  designWorks: DesignWork[];
  diagrams: Record<string, Diagram>; // Indexed by diagram ID (includes shapes, connectors, viewport)
  interfaces: Record<string, Interface>; // Indexed by interface ID
  documents: Record<string, Document>; // Indexed by document ID

  // Loading states (per-entity)
  loading: {
    designWorks: boolean;
    diagrams: Record<string, boolean>; // Per-diagram loading state
    interfaces: Record<string, boolean>; // Per-interface loading state
    documents: Record<string, boolean>; // Per-document loading state
  };

  // Error states (per-entity)
  errors: {
    designWorks: Error | null;
    diagrams: Record<string, Error | null>; // Per-diagram error state
    interfaces: Record<string, Error | null>; // Per-interface error state
    documents: Record<string, Error | null>; // Per-document error state
  };

  // DesignWork actions
  fetchDesignWorks: (solutionId: string) => Promise<void>;
  createDesignWork: (data: CreateDesignWorkDto) => Promise<DesignWork>;
  updateDesignWork: (id: string, updates: Partial<DesignWork>) => Promise<void>;
  deleteDesignWork: (id: string) => Promise<void>;

  // Diagram actions - now lazy loaded per-item
  fetchDiagram: (id: string) => Promise<void>;
  createDiagram: (data: CreateDiagramDto) => Promise<Diagram>;
  updateDiagram: (id: string, updates: Partial<Diagram>) => Promise<void>;
  deleteDiagram: (id: string) => Promise<void>;

  // Interface actions - now lazy loaded per-item
  fetchInterface: (id: string) => Promise<void>;
  createInterface: (data: CreateInterfaceDto) => Promise<Interface>;
  updateInterface: (id: string, updates: Partial<Interface>) => Promise<void>;
  deleteInterface: (id: string) => Promise<void>;

  // Document actions - now lazy loaded per-item
  fetchDocument: (id: string) => Promise<void>;
  createDocument: (data: CreateDocumentDto) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  // Shape manipulation actions (work with diagram.shapes[])
  addShape: (diagramId: string, shape: CreateShapeDTO) => Promise<void>;
  updateShape: (diagramId: string, shapeId: string, updates: Partial<Shape>) => Promise<void>;
  updateShapes: (diagramId: string, updates: Array<{ shapeId: string; updates: Partial<Shape> }>) => Promise<void>;
  updateShapeLabel: (diagramId: string, shapeId: string, newLabel: string) => Promise<void>;
  deleteShape: (diagramId: string, shapeId: string) => Promise<void>;
  deleteShapes: (diagramId: string, shapeIds: string[]) => Promise<void>;

  // Internal shape actions (used by commands, not wrapped)
  _internalAddShape: (diagramId: string, shape: CreateShapeDTO) => Promise<Diagram>;
  _internalAddShapesBatch: (diagramId: string, shapes: CreateShapeDTO[]) => Promise<Diagram>;
  _internalUpdateShape: (diagramId: string, shapeId: string, updates: Partial<Shape>) => Promise<Diagram | null>;
  _internalUpdateShapes: (diagramId: string, updates: Array<{ shapeId: string; updates: Partial<Shape> }>) => Promise<Diagram | null>;
  _internalDeleteShape: (diagramId: string, shapeId: string) => Promise<Diagram | null>;
  _internalRestoreShape: (diagramId: string, shape: Shape) => Promise<Diagram>;
  _internalGetShape: (diagramId: string, shapeId: string) => Promise<Shape | null>;

  // Connector manipulation actions (work with diagram.connectors[])
  addConnector: (diagramId: string, connector: CreateConnectorDTO) => Promise<void>;
  updateConnectorLabel: (diagramId: string, connectorId: string, newLabel: string) => Promise<void>;
  deleteConnector: (diagramId: string, connectorId: string) => Promise<void>;
  deleteConnectors: (diagramId: string, connectorIds: string[]) => Promise<void>;

  // Internal connector actions (used by commands, not wrapped)
  _internalAddConnector: (diagramId: string, connector: CreateConnectorDTO) => Promise<Diagram | null>;
  _internalAddConnectorsBatch: (diagramId: string, connectors: CreateConnectorDTO[]) => Promise<Diagram | null>;
  _internalUpdateConnector: (diagramId: string, connectorId: string, updates: Partial<Connector>) => Promise<Diagram | null>;
  _internalDeleteConnector: (diagramId: string, connectorId: string) => Promise<Diagram | null>;
  _internalRestoreConnector: (diagramId: string, connector: Connector) => Promise<Diagram | null>;
  _internalGetConnector: (diagramId: string, connectorId: string) => Promise<Connector | null>;

  // Batch connector actions (used by commands for atomic operations)
  _internalDeleteConnectorsBatch: (diagramId: string, connectorIds: string[]) => Promise<Diagram | null>;
  _internalRestoreConnectorsBatch: (diagramId: string, connectors: Connector[]) => Promise<Diagram | null>;

  // Batch shape actions (used by commands for atomic operations)
  _internalDeleteShapesBatch: (diagramId: string, shapeIds: string[]) => Promise<Diagram | null>;
  _internalRestoreShapesBatch: (diagramId: string, shapes: Shape[]) => Promise<Diagram | null>;

  // Internal diagram actions
  _internalUpdateDiagramMermaid: (diagramId: string, mermaidSyntax: string) => void;

  // Utility actions
  initializeData: () => void;
}

// Initialize mock data on module load
initializeMockData();

export const useDesignStudioEntityStore = create<DesignStudioEntityStore>((set, get) => {
  // Initialize CommandFactory with store dependencies
  const commandFactory = new CommandFactory({
    _internalAddShape: (diagramId, shape) => get()._internalAddShape(diagramId, shape),
    _internalDeleteShape: (diagramId, shapeId) => get()._internalDeleteShape(diagramId, shapeId),
    _internalUpdateShape: (diagramId, shapeId, updates) => get()._internalUpdateShape(diagramId, shapeId, updates),
    _internalUpdateShapes: (diagramId, updates) => get()._internalUpdateShapes(diagramId, updates),
    _internalRestoreShape: (diagramId, shape) => get()._internalRestoreShape(diagramId, shape),
    _internalGetShape: (diagramId, shapeId) => get()._internalGetShape(diagramId, shapeId),
    _internalAddConnector: (diagramId, connector) => get()._internalAddConnector(diagramId, connector),
    _internalDeleteConnector: (diagramId, connectorId) => get()._internalDeleteConnector(diagramId, connectorId),
    _internalUpdateConnector: (diagramId, connectorId, updates) => get()._internalUpdateConnector(diagramId, connectorId, updates),
    _internalRestoreConnector: (diagramId, connector) => get()._internalRestoreConnector(diagramId, connector),
    _internalGetConnector: (diagramId, connectorId) => get()._internalGetConnector(diagramId, connectorId),
    _internalDeleteConnectorsBatch: (diagramId, connectorIds) => get()._internalDeleteConnectorsBatch(diagramId, connectorIds),
    _internalRestoreConnectorsBatch: (diagramId, connectors) => get()._internalRestoreConnectorsBatch(diagramId, connectors),
    _internalDeleteShapesBatch: (diagramId, shapeIds) => get()._internalDeleteShapesBatch(diagramId, shapeIds),
    _internalRestoreShapesBatch: (diagramId, shapes) => get()._internalRestoreShapesBatch(diagramId, shapes),
    getDiagram: (diagramId) => get().diagrams[diagramId] ?? null,
    getUpdateLocalShape: (diagramId) => {
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      return canvasInstance.getState().updateLocalShape;
    },
    getUpdateLocalConnector: (diagramId) => {
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      return canvasInstance.getState().updateLocalConnector;
    },
    getCurrentConnector: (diagramId, connectorId) => {
      const diagram = get().diagrams[diagramId];
      if (!diagram) return null;
      return diagram.connectors.find((c) => c.id === connectorId) ?? null;
    },
  });

  return {
  // Command factory instance
  commandFactory,

  // Initial state
  designWorks: [],
  diagrams: {},
  interfaces: {},
  documents: {},

  loading: {
    designWorks: false,
    diagrams: {},
    interfaces: {},
    documents: {},
  },

  errors: {
    designWorks: null,
    diagrams: {},
    interfaces: {},
    documents: {},
  },

  // DesignWork actions
  fetchDesignWorks: async (solutionId: string) => {
    set((state) => ({
      loading: { ...state.loading, designWorks: true },
      errors: { ...state.errors, designWorks: null },
    }));

    try {
      const designWorks = await designWorkApi.list(solutionId);
      set((state) => ({
        designWorks,
        loading: { ...state.loading, designWorks: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch design works');
      set((state) => ({
        loading: { ...state.loading, designWorks: false },
        errors: { ...state.errors, designWorks: err },
      }));
      console.error('Failed to load design works:', err);
    }
  },

  createDesignWork: async (data: CreateDesignWorkDto) => {
    set((state) => ({
      loading: { ...state.loading, designWorks: true },
      errors: { ...state.errors, designWorks: null },
    }));

    try {
      const designWork = await designWorkApi.create(data);
      set((state) => ({
        designWorks: [...state.designWorks, designWork],
        loading: { ...state.loading, designWorks: false },
      }));
      return designWork;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create design work');
      set((state) => ({
        loading: { ...state.loading, designWorks: false },
        errors: { ...state.errors, designWorks: err },
      }));
      throw error;
    }
  },

  updateDesignWork: async (id: string, updates: Partial<DesignWork>) => {
    set((state) => ({
      loading: { ...state.loading, designWorks: true },
      errors: { ...state.errors, designWorks: null },
    }));

    try {
      const updated = await designWorkApi.update(id, updates);
      if (updated) {
        set((state) => ({
          designWorks: state.designWorks.map((dw) => (dw.id === id ? updated : dw)),
          loading: { ...state.loading, designWorks: false },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update design work');
      set((state) => ({
        loading: { ...state.loading, designWorks: false },
        errors: { ...state.errors, designWorks: err },
      }));
      throw error;
    }
  },

  deleteDesignWork: async (id: string) => {
    set((state) => ({
      loading: { ...state.loading, designWorks: true },
      errors: { ...state.errors, designWorks: null },
    }));

    try {
      // Get all descendant IDs for cascade delete
      const descendantIds = await designWorkApi.getAllDescendantIds(id);
      const allIdsToDelete = [id, ...descendantIds];

      // Delete from API
      await designWorkApi.delete(id);

      // Cascade delete children
      for (const childId of descendantIds) {
        await designWorkApi.delete(childId);
      }

      // Collect all diagram IDs that will be deleted and clear their command histories
      const allDiagramIds: string[] = [];
      for (const designWorkId of allIdsToDelete) {
        const designWork = get().designWorks.find(dw => dw.id === designWorkId);
        if (designWork) {
          designWork.diagrams.forEach(ref => allDiagramIds.push(ref.id));
        }
      }

      // Clear command histories for all diagrams before deletion
      allDiagramIds.forEach(diagramId => {
        commandManager.clearScope(diagramId);
      });

      // Delete all related content
      for (const designWorkId of allIdsToDelete) {
        await diagramApi.deleteByDesignWorkId(designWorkId);
        await interfaceApi.deleteByDesignWorkId(designWorkId);
        await documentApi.deleteByDesignWorkId(designWorkId);
      }

      // Update local state - filter designWorks array and clean up content Records
      set((state) => {
        const newDiagrams = { ...state.diagrams };
        const newInterfaces = { ...state.interfaces };
        const newDocuments = { ...state.documents };

        // Get the design work to access its content refs
        const designWork = state.designWorks.find((dw) => dw.id === id);
        if (designWork) {
          // Remove all content items referenced by this design work
          designWork.diagrams.forEach((ref) => delete newDiagrams[ref.id]);
          designWork.interfaces.forEach((ref) => delete newInterfaces[ref.id]);
          designWork.documents.forEach((ref) => delete newDocuments[ref.id]);
        }

        return {
          designWorks: state.designWorks.filter((dw) => !allIdsToDelete.includes(dw.id)),
          diagrams: newDiagrams,
          interfaces: newInterfaces,
          documents: newDocuments,
          loading: { ...state.loading, designWorks: false },
        };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete design work');
      set((state) => ({
        loading: { ...state.loading, designWorks: false },
        errors: { ...state.errors, designWorks: err },
      }));
      throw error;
    }
  },

  // Diagram actions - lazy load individual diagrams
  fetchDiagram: async (id: string) => {
    // Skip if already loaded
    if (get().diagrams[id]) {
      return;
    }

    set((state) => ({
      loading: {
        ...state.loading,
        diagrams: { ...state.loading.diagrams, [id]: true },
      },
      errors: {
        ...state.errors,
        diagrams: { ...state.errors.diagrams, [id]: null },
      },
    }));

    try {
      const diagram = await diagramApi.get(id);
      if (diagram) {
        set((state) => ({
          diagrams: {
            ...state.diagrams,
            [id]: diagram,
          },
          loading: {
            ...state.loading,
            diagrams: { ...state.loading.diagrams, [id]: false },
          },
        }));
      } else {
        // Diagram not found - still need to set loading to false
        set((state) => ({
          loading: {
            ...state.loading,
            diagrams: { ...state.loading.diagrams, [id]: false },
          },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch diagram');
      set((state) => ({
        loading: {
          ...state.loading,
          diagrams: { ...state.loading.diagrams, [id]: false },
        },
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [id]: err },
        },
      }));
      console.error('Failed to load diagram:', err);
    }
  },

  createDiagram: async (data: CreateDiagramDto) => {
    set((state) => ({
      loading: {
        ...state.loading,
        diagrams: { ...state.loading.diagrams, creating: true },
      },
      errors: {
        ...state.errors,
        diagrams: { ...state.errors.diagrams, creating: null },
      },
    }));

    try {
      const diagram = await diagramApi.create(data);

      // Find parent DesignWork and add diagram reference
      const parentDesignWork = get().designWorks.find(dw => dw.id === data.designWorkId);
      if (!parentDesignWork) {
        throw new Error(`DesignWork ${data.designWorkId} not found`);
      }

      // Calculate next order across all content types
      const allOrders = [
        ...parentDesignWork.diagrams.map(d => d.order),
        ...parentDesignWork.interfaces.map(i => i.order),
        ...parentDesignWork.documents.map(d => d.order),
      ];
      const nextOrder = allOrders.length > 0 ? Math.max(...allOrders) + 1 : 0;

      // Create diagram reference
      const diagramRef = {
        id: diagram.id,
        name: diagram.name,
        type: diagram.type,
        order: nextOrder,
      };

      // Update parent DesignWork with the new diagram reference
      const updatedDesignWork = {
        ...parentDesignWork,
        diagrams: [...parentDesignWork.diagrams, diagramRef],
      };

      // Persist updated DesignWork to storage FIRST to avoid race conditions
      await designWorkApi.update(updatedDesignWork.id, updatedDesignWork);

      // Then update store with both diagram and updated DesignWork
      set((state) => ({
        diagrams: {
          ...state.diagrams,
          [diagram.id]: diagram,
        },
        designWorks: state.designWorks.map(dw =>
          dw.id === data.designWorkId ? updatedDesignWork : dw
        ),
        loading: {
          ...state.loading,
          diagrams: { ...state.loading.diagrams, creating: false },
        },
      }));

      return diagram;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create diagram');
      set((state) => ({
        loading: {
          ...state.loading,
          diagrams: { ...state.loading.diagrams, creating: false },
        },
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, creating: err },
        },
      }));
      throw error;
    }
  },

  updateDiagram: async (id: string, updates: Partial<Diagram>) => {
    set((state) => ({
      loading: {
        ...state.loading,
        diagrams: { ...state.loading.diagrams, [id]: true },
      },
      errors: {
        ...state.errors,
        diagrams: { ...state.errors.diagrams, [id]: null },
      },
    }));

    try {
      const updated = await diagramApi.update(id, updates);
      if (updated) {
        set((state) => ({
          diagrams: {
            ...state.diagrams,
            [id]: updated,
          },
          loading: {
            ...state.loading,
            diagrams: { ...state.loading.diagrams, [id]: false },
          },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update diagram');
      set((state) => ({
        loading: {
          ...state.loading,
          diagrams: { ...state.loading.diagrams, [id]: false },
        },
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [id]: err },
        },
      }));
      throw error;
    }
  },

  deleteDiagram: async (id: string) => {
    set((state) => ({
      loading: {
        ...state.loading,
        diagrams: { ...state.loading.diagrams, [id]: true },
      },
      errors: {
        ...state.errors,
        diagrams: { ...state.errors.diagrams, [id]: null },
      },
    }));

    try {
      await diagramApi.delete(id);

      // Clear command history for this diagram
      commandManager.clearScope(id);

      // Find and update the parent DesignWork to remove the diagram reference
      const parentDesignWork = get().designWorks.find(dw =>
        dw.diagrams.some(d => d.id === id)
      );

      set((state) => {
        const newDiagrams = { ...state.diagrams };
        const newLoadingDiagrams = { ...state.loading.diagrams };
        const newErrorsDiagrams = { ...state.errors.diagrams };

        delete newDiagrams[id];
        delete newLoadingDiagrams[id];
        delete newErrorsDiagrams[id];

        // Update designWorks to remove the diagram reference
        const updatedDesignWorks = parentDesignWork
          ? state.designWorks.map(dw =>
              dw.id === parentDesignWork.id
                ? { ...dw, diagrams: dw.diagrams.filter(d => d.id !== id) }
                : dw
            )
          : state.designWorks;

        return {
          diagrams: newDiagrams,
          designWorks: updatedDesignWorks,
          loading: {
            ...state.loading,
            diagrams: newLoadingDiagrams,
          },
          errors: {
            ...state.errors,
            diagrams: newErrorsDiagrams,
          },
        };
      });

      // Persist updated DesignWork to storage
      if (parentDesignWork) {
        const updatedDesignWork = {
          ...parentDesignWork,
          diagrams: parentDesignWork.diagrams.filter(d => d.id !== id),
        };
        await designWorkApi.update(updatedDesignWork.id, updatedDesignWork);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete diagram');
      set((state) => ({
        loading: {
          ...state.loading,
          diagrams: { ...state.loading.diagrams, [id]: false },
        },
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [id]: err },
        },
      }));
      throw error;
    }
  },

  // Interface actions - lazy load individual interfaces
  fetchInterface: async (id: string) => {
    // Skip if already loaded
    if (get().interfaces[id]) {
      return;
    }

    set((state) => ({
      loading: {
        ...state.loading,
        interfaces: { ...state.loading.interfaces, [id]: true },
      },
      errors: {
        ...state.errors,
        interfaces: { ...state.errors.interfaces, [id]: null },
      },
    }));

    try {
      const interfaceItem = await interfaceApi.get(id);
      if (interfaceItem) {
        set((state) => ({
          interfaces: {
            ...state.interfaces,
            [id]: interfaceItem,
          },
          loading: {
            ...state.loading,
            interfaces: { ...state.loading.interfaces, [id]: false },
          },
        }));
      } else {
        // Interface not found - still need to set loading to false
        set((state) => ({
          loading: {
            ...state.loading,
            interfaces: { ...state.loading.interfaces, [id]: false },
          },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch interface');
      set((state) => ({
        loading: {
          ...state.loading,
          interfaces: { ...state.loading.interfaces, [id]: false },
        },
        errors: {
          ...state.errors,
          interfaces: { ...state.errors.interfaces, [id]: err },
        },
      }));
      console.error('Failed to load interface:', err);
    }
  },

  createInterface: async (data: CreateInterfaceDto) => {
    set((state) => ({
      loading: {
        ...state.loading,
        interfaces: { ...state.loading.interfaces, creating: true },
      },
      errors: {
        ...state.errors,
        interfaces: { ...state.errors.interfaces, creating: null },
      },
    }));

    try {
      const interfaceItem = await interfaceApi.create(data);

      // Find parent DesignWork and add interface reference
      const parentDesignWork = get().designWorks.find(dw => dw.id === data.designWorkId);
      if (!parentDesignWork) {
        throw new Error(`DesignWork ${data.designWorkId} not found`);
      }

      // Calculate next order across all content types
      const allOrders = [
        ...parentDesignWork.diagrams.map(d => d.order),
        ...parentDesignWork.interfaces.map(i => i.order),
        ...parentDesignWork.documents.map(d => d.order),
      ];
      const nextOrder = allOrders.length > 0 ? Math.max(...allOrders) + 1 : 0;

      // Create interface reference
      const interfaceRef = {
        id: interfaceItem.id,
        name: interfaceItem.name,
        fidelity: interfaceItem.fidelity,
        order: nextOrder,
      };

      // Update parent DesignWork with the new interface reference
      const updatedDesignWork = {
        ...parentDesignWork,
        interfaces: [...parentDesignWork.interfaces, interfaceRef],
      };

      // Persist updated DesignWork to storage FIRST to avoid race conditions
      await designWorkApi.update(updatedDesignWork.id, updatedDesignWork);

      // Then update store with both interface and updated DesignWork
      set((state) => ({
        interfaces: {
          ...state.interfaces,
          [interfaceItem.id]: interfaceItem,
        },
        designWorks: state.designWorks.map(dw =>
          dw.id === data.designWorkId ? updatedDesignWork : dw
        ),
        loading: {
          ...state.loading,
          interfaces: { ...state.loading.interfaces, creating: false },
        },
      }));

      return interfaceItem;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create interface');
      set((state) => ({
        loading: {
          ...state.loading,
          interfaces: { ...state.loading.interfaces, creating: false },
        },
        errors: {
          ...state.errors,
          interfaces: { ...state.errors.interfaces, creating: err },
        },
      }));
      throw error;
    }
  },

  updateInterface: async (id: string, updates: Partial<Interface>) => {
    set((state) => ({
      loading: {
        ...state.loading,
        interfaces: { ...state.loading.interfaces, [id]: true },
      },
      errors: {
        ...state.errors,
        interfaces: { ...state.errors.interfaces, [id]: null },
      },
    }));

    try {
      const updated = await interfaceApi.update(id, updates);
      if (updated) {
        set((state) => ({
          interfaces: {
            ...state.interfaces,
            [id]: updated,
          },
          loading: {
            ...state.loading,
            interfaces: { ...state.loading.interfaces, [id]: false },
          },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update interface');
      set((state) => ({
        loading: {
          ...state.loading,
          interfaces: { ...state.loading.interfaces, [id]: false },
        },
        errors: {
          ...state.errors,
          interfaces: { ...state.errors.interfaces, [id]: err },
        },
      }));
      throw error;
    }
  },

  deleteInterface: async (id: string) => {
    set((state) => ({
      loading: {
        ...state.loading,
        interfaces: { ...state.loading.interfaces, [id]: true },
      },
      errors: {
        ...state.errors,
        interfaces: { ...state.errors.interfaces, [id]: null },
      },
    }));

    try {
      await interfaceApi.delete(id);

      // Find and update the parent DesignWork to remove the interface reference
      const parentDesignWork = get().designWorks.find(dw =>
        dw.interfaces.some(i => i.id === id)
      );

      set((state) => {
        const newInterfaces = { ...state.interfaces };
        const newLoadingInterfaces = { ...state.loading.interfaces };
        const newErrorsInterfaces = { ...state.errors.interfaces };

        delete newInterfaces[id];
        delete newLoadingInterfaces[id];
        delete newErrorsInterfaces[id];

        // Update designWorks to remove the interface reference
        const updatedDesignWorks = parentDesignWork
          ? state.designWorks.map(dw =>
              dw.id === parentDesignWork.id
                ? { ...dw, interfaces: dw.interfaces.filter(i => i.id !== id) }
                : dw
            )
          : state.designWorks;

        return {
          interfaces: newInterfaces,
          designWorks: updatedDesignWorks,
          loading: {
            ...state.loading,
            interfaces: newLoadingInterfaces,
          },
          errors: {
            ...state.errors,
            interfaces: newErrorsInterfaces,
          },
        };
      });

      // Persist updated DesignWork to storage
      if (parentDesignWork) {
        const updatedDesignWork = {
          ...parentDesignWork,
          interfaces: parentDesignWork.interfaces.filter(i => i.id !== id),
        };
        await designWorkApi.update(updatedDesignWork.id, updatedDesignWork);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete interface');
      set((state) => ({
        loading: {
          ...state.loading,
          interfaces: { ...state.loading.interfaces, [id]: false },
        },
        errors: {
          ...state.errors,
          interfaces: { ...state.errors.interfaces, [id]: err },
        },
      }));
      throw error;
    }
  },

  // Document actions - lazy load individual documents
  fetchDocument: async (id: string) => {
    // Skip if already loaded
    if (get().documents[id]) {
      return;
    }

    set((state) => ({
      loading: {
        ...state.loading,
        documents: { ...state.loading.documents, [id]: true },
      },
      errors: {
        ...state.errors,
        documents: { ...state.errors.documents, [id]: null },
      },
    }));

    try {
      const document = await documentApi.get(id);
      if (document) {
        set((state) => ({
          documents: {
            ...state.documents,
            [id]: document,
          },
          loading: {
            ...state.loading,
            documents: { ...state.loading.documents, [id]: false },
          },
        }));
      } else {
        // Document not found - still need to set loading to false
        set((state) => ({
          loading: {
            ...state.loading,
            documents: { ...state.loading.documents, [id]: false },
          },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch document');
      set((state) => ({
        loading: {
          ...state.loading,
          documents: { ...state.loading.documents, [id]: false },
        },
        errors: {
          ...state.errors,
          documents: { ...state.errors.documents, [id]: err },
        },
      }));
      console.error('Failed to load document:', err);
    }
  },

  createDocument: async (data: CreateDocumentDto) => {
    set((state) => ({
      loading: {
        ...state.loading,
        documents: { ...state.loading.documents, creating: true },
      },
      errors: {
        ...state.errors,
        documents: { ...state.errors.documents, creating: null },
      },
    }));

    try {
      const document = await documentApi.create(data);

      // Find parent DesignWork and add document reference
      const parentDesignWork = get().designWorks.find(dw => dw.id === data.designWorkId);
      if (!parentDesignWork) {
        throw new Error(`DesignWork ${data.designWorkId} not found`);
      }

      // Calculate next order across all content types
      const allOrders = [
        ...parentDesignWork.diagrams.map(d => d.order),
        ...parentDesignWork.interfaces.map(i => i.order),
        ...parentDesignWork.documents.map(d => d.order),
      ];
      const nextOrder = allOrders.length > 0 ? Math.max(...allOrders) + 1 : 0;

      // Create document reference
      const documentRef = {
        id: document.id,
        name: document.name,
        order: nextOrder,
      };

      // Update parent DesignWork with the new document reference
      const updatedDesignWork = {
        ...parentDesignWork,
        documents: [...parentDesignWork.documents, documentRef],
      };

      // Persist updated DesignWork to storage FIRST to avoid race conditions
      await designWorkApi.update(updatedDesignWork.id, updatedDesignWork);

      // Then update store with both document and updated DesignWork
      set((state) => ({
        documents: {
          ...state.documents,
          [document.id]: document,
        },
        designWorks: state.designWorks.map(dw =>
          dw.id === data.designWorkId ? updatedDesignWork : dw
        ),
        loading: {
          ...state.loading,
          documents: { ...state.loading.documents, creating: false },
        },
      }));

      return document;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create document');
      set((state) => ({
        loading: {
          ...state.loading,
          documents: { ...state.loading.documents, creating: false },
        },
        errors: {
          ...state.errors,
          documents: { ...state.errors.documents, creating: err },
        },
      }));
      throw error;
    }
  },

  updateDocument: async (id: string, updates: Partial<Document>) => {
    set((state) => ({
      loading: {
        ...state.loading,
        documents: { ...state.loading.documents, [id]: true },
      },
      errors: {
        ...state.errors,
        documents: { ...state.errors.documents, [id]: null },
      },
    }));

    try {
      const updated = await documentApi.update(id, updates);
      if (updated) {
        set((state) => ({
          documents: {
            ...state.documents,
            [id]: updated,
          },
          loading: {
            ...state.loading,
            documents: { ...state.loading.documents, [id]: false },
          },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update document');
      set((state) => ({
        loading: {
          ...state.loading,
          documents: { ...state.loading.documents, [id]: false },
        },
        errors: {
          ...state.errors,
          documents: { ...state.errors.documents, [id]: err },
        },
      }));
      throw error;
    }
  },

  deleteDocument: async (id: string) => {
    set((state) => ({
      loading: {
        ...state.loading,
        documents: { ...state.loading.documents, [id]: true },
      },
      errors: {
        ...state.errors,
        documents: { ...state.errors.documents, [id]: null },
      },
    }));

    try {
      await documentApi.delete(id);

      // Find and update the parent DesignWork to remove the document reference
      const parentDesignWork = get().designWorks.find(dw =>
        dw.documents.some(d => d.id === id)
      );

      set((state) => {
        const newDocuments = { ...state.documents };
        const newLoadingDocuments = { ...state.loading.documents };
        const newErrorsDocuments = { ...state.errors.documents };

        delete newDocuments[id];
        delete newLoadingDocuments[id];
        delete newErrorsDocuments[id];

        // Update designWorks to remove the document reference
        const updatedDesignWorks = parentDesignWork
          ? state.designWorks.map(dw =>
              dw.id === parentDesignWork.id
                ? { ...dw, documents: dw.documents.filter(d => d.id !== id) }
                : dw
            )
          : state.designWorks;

        return {
          documents: newDocuments,
          designWorks: updatedDesignWorks,
          loading: {
            ...state.loading,
            documents: newLoadingDocuments,
          },
          errors: {
            ...state.errors,
            documents: newErrorsDocuments,
          },
        };
      });

      // Persist updated DesignWork to storage
      if (parentDesignWork) {
        const updatedDesignWork = {
          ...parentDesignWork,
          documents: parentDesignWork.documents.filter(d => d.id !== id),
        };
        await designWorkApi.update(updatedDesignWork.id, updatedDesignWork);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete document');
      set((state) => ({
        loading: {
          ...state.loading,
          documents: { ...state.loading.documents, [id]: false },
        },
        errors: {
          ...state.errors,
          documents: { ...state.errors.documents, [id]: err },
        },
      }));
      throw error;
    }
  },

  // Shape actions - diagrams now contain their shapes directly
  // No separate fetchCanvasContent needed - shapes are loaded with the diagram via fetchDiagram

  addShape: async (diagramId: string, shape: CreateShapeDTO) => {
    try {
      // Create and execute command
      const command = commandFactory.createAddShape(diagramId, shape);
      await commandManager.execute(command, diagramId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to add shape');
      set((state) => ({
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [diagramId]: err },
        },
      }));
      throw error;
    }
  },

  _internalAddShape: async (diagramId: string, shape: CreateShapeDTO) => {
    const updatedDiagram = await diagramApi.addShape(diagramId, shape);

    if (!updatedDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    set((state) => ({
      diagrams: {
        ...state.diagrams,
        [diagramId]: updatedDiagram,
      },
    }));

    // Update canvas instance local state to ensure immediate rendering
    const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
    if (updatedDiagram.shapes.length > 0) {
      const newShape = updatedDiagram.shapes[updatedDiagram.shapes.length - 1];
      canvasInstance.getState().addLocalShape(newShape);
    }

    return updatedDiagram;
  },

  _internalAddShapesBatch: async (diagramId: string, shapes: CreateShapeDTO[]) => {
    // Add all shapes sequentially to the API but only trigger one set() at the end
    let currentDiagram = get().diagrams[diagramId];
    if (!currentDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    for (const shape of shapes) {
      const updatedDiagram = await diagramApi.addShape(diagramId, shape);
      if (!updatedDiagram) {
        throw new Error(`Failed to add shape to diagram ${diagramId}`);
      }
      currentDiagram = updatedDiagram;
    }

    // Single set() call at the end
    set((state) => ({
      diagrams: {
        ...state.diagrams,
        [diagramId]: currentDiagram,
      },
    }));

    // Update canvas instance with all new shapes
    const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
    const startIndex = currentDiagram.shapes.length - shapes.length;
    for (let i = 0; i < shapes.length; i++) {
      const newShape = currentDiagram.shapes[startIndex + i];
      canvasInstance.getState().addLocalShape(newShape);
    }

    return currentDiagram;
  },

  updateShape: async (diagramId: string, shapeId: string, updates: Partial<Shape>) => {
    try {
      // Get the current shape to capture before state
      const currentShape = await get()._internalGetShape(diagramId, shapeId);
      if (!currentShape) {
        throw new Error(`Shape ${shapeId} not found`);
      }

      // Extract only the properties that are being updated
      const beforeState: Partial<Shape> = {};
      const afterState: Partial<Shape> = {};

      Object.keys(updates).forEach((key) => {
        const typedKey = key as keyof Shape;
        (beforeState as Record<string, unknown>)[typedKey] = currentShape[typedKey];
        (afterState as Record<string, unknown>)[typedKey] = updates[typedKey];
      });

      // Only position updates are currently supported
      const isPositionOnly =
        Object.keys(updates).length === 2 &&
        'x' in updates &&
        'y' in updates;

      if (!isPositionOnly) {
        throw new Error('Only position updates (x, y) are currently supported');
      }

      const command = commandFactory.createMoveShape(
        diagramId,
        shapeId,
        { x: currentShape.x, y: currentShape.y },
        { x: updates.x!, y: updates.y! }
      );
      await commandManager.execute(command, diagramId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update shape');
      set((state) => ({
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [diagramId]: err },
        },
      }));
      throw error;
    }
  },

  updateShapes: async (diagramId: string, updates: Array<{ shapeId: string; updates: Partial<Shape> }>) => {
    try {
      // Build array of moves with before/after positions
      const moves = await Promise.all(
        updates.map(async ({ shapeId, updates: shapeUpdates }) => {
          const currentShape = await get()._internalGetShape(diagramId, shapeId);
          if (!currentShape) {
            throw new Error(`Shape ${shapeId} not found`);
          }

          // Only position updates are currently supported
          const isPositionOnly =
            Object.keys(shapeUpdates).length === 2 &&
            'x' in shapeUpdates &&
            'y' in shapeUpdates;

          if (!isPositionOnly) {
            throw new Error('Only position updates (x, y) are currently supported');
          }

          return {
            shapeId,
            fromPosition: { x: currentShape.x, y: currentShape.y },
            toPosition: { x: shapeUpdates.x!, y: shapeUpdates.y! },
          };
        })
      );

      // Create ONE MoveEntitiesCommand with batched update function
      const command = commandFactory.createMoveEntities(diagramId, moves);

      // Execute the single command (one API call, one state update)
      await commandManager.execute(command, diagramId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update shapes');
      set((state) => ({
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [diagramId]: err },
        },
      }));
      throw error;
    }
  },

  _internalUpdateShape: async (diagramId: string, shapeId: string, updates: Partial<Shape>) => {
    const updatedDiagram = await diagramApi.updateShape(diagramId, shapeId, updates);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: {
          ...state.diagrams,
          [diagramId]: updatedDiagram,
        },
      }));
    }

    return updatedDiagram;
  },

  _internalUpdateShapes: async (diagramId: string, updates: Array<{ shapeId: string; updates: Partial<Shape> }>) => {
    const updatedDiagram = await diagramApi.updateShapes(diagramId, updates);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: {
          ...state.diagrams,
          [diagramId]: updatedDiagram,
        },
      }));
    }

    return updatedDiagram;
  },

  updateShapeLabel: async (diagramId: string, shapeId: string, newLabel: string) => {
    try {
      // Get current shape to capture old label
      const currentShape = await get()._internalGetShape(diagramId, shapeId);
      if (!currentShape) {
        throw new Error(`Shape ${shapeId} not found`);
      }

      // Create and execute command
      const command = commandFactory.createUpdateShapeLabel(
        diagramId,
        shapeId,
        currentShape.label,
        newLabel
      );
      await commandManager.execute(command, diagramId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update shape label');
      set((state) => ({
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [diagramId]: err },
        },
      }));
      throw error;
    }
  },

  deleteShape: async (diagramId: string, shapeId: string) => {
    try {
      // Create and execute command with batch connector deletion support
      const command = commandFactory.createDeleteShape(diagramId, shapeId);
      await commandManager.execute(command, diagramId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete shape');
      set((state) => ({
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [diagramId]: err },
        },
      }));
      throw error;
    }
  },

  deleteShapes: async (diagramId: string, shapeIds: string[]) => {
    try {
      // Create and execute batch delete command (single undo operation)
      const command = commandFactory.createBatchDeleteShapes(diagramId, shapeIds);
      await commandManager.execute(command, diagramId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete shapes');
      set((state) => ({
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [diagramId]: err },
        },
      }));
      throw error;
    }
  },

  _internalDeleteShape: async (diagramId: string, shapeId: string) => {
    const updatedDiagram = await diagramApi.deleteShape(diagramId, shapeId);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: {
          ...state.diagrams,
          [diagramId]: updatedDiagram,
        },
      }));

      // Update canvas instance local state
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      canvasInstance.getState().removeLocalShape(shapeId);
    }

    return updatedDiagram;
  },

  _internalRestoreShape: async (diagramId: string, shape: Shape) => {
    const updatedDiagram = await diagramApi.restoreShape(diagramId, shape);

    if (!updatedDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    set((state) => ({
      diagrams: {
        ...state.diagrams,
        [diagramId]: updatedDiagram,
      },
    }));

    // Update canvas instance local state
    const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
    canvasInstance.getState().addLocalShape(shape);

    return updatedDiagram;
  },

  _internalGetShape: async (diagramId: string, shapeId: string) => {
    const diagram = get().diagrams[diagramId];
    if (!diagram) {
      return null;
    }

    const shape = diagram.shapes.find((s) => s.id === shapeId);
    return shape ?? null;
  },

  // Connector actions
  addConnector: async (diagramId: string, connector: CreateConnectorDTO) => {
    try {
      // Create and execute command
      const command = commandFactory.createAddConnector(diagramId, connector);
      await commandManager.execute(command, diagramId);

      // Refresh activation boxes and lifeline heights for sequence diagrams
      const diagram = get().diagrams[diagramId];
      if (diagram?.type === 'sequence' && connector.type.startsWith('sequence-')) {
        // Calculate and update lifeline heights first
        const { calculateRequiredLifelineHeight } = await import('~/design-studio/utils/lifelineHeightCalculator');
        const requiredHeight = calculateRequiredLifelineHeight(
          diagram.shapes,
          diagram.connectors || []
        );
        const heightCommand = commandFactory.createUpdateLifelineHeights(diagramId, requiredHeight);
        await commandManager.execute(heightCommand, diagramId);

        // Then refresh activation boxes
        const refreshCommand = commandFactory.createRefreshSequenceActivations(diagramId);
        await commandManager.execute(refreshCommand, diagramId);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to add connector');
      set((state) => ({
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [diagramId]: err },
        },
      }));
      throw error;
    }
  },

  _internalAddConnector: async (diagramId: string, connector: CreateConnectorDTO) => {
    const updatedDiagram = await diagramApi.addConnector(diagramId, connector);

    if (!updatedDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    set((state) => ({
      diagrams: {
        ...state.diagrams,
        [diagramId]: updatedDiagram,
      },
    }));

    // Update canvas instance local state
    const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
    if (updatedDiagram.connectors.length > 0) {
      const newConnector = updatedDiagram.connectors[updatedDiagram.connectors.length - 1];
      canvasInstance.getState().addLocalConnector(newConnector);
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
      diagrams: {
        ...state.diagrams,
        [diagramId]: currentDiagram,
      },
    }));

    // Update canvas instance with all new connectors
    const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
    const startIndex = currentDiagram.connectors.length - connectors.length;
    for (let i = 0; i < connectors.length; i++) {
      const newConnector = currentDiagram.connectors[startIndex + i];
      canvasInstance.getState().addLocalConnector(newConnector);
    }

    return currentDiagram;
  },

  updateConnectorLabel: async (diagramId: string, connectorId: string, newLabel: string) => {
    try {
      // Get current connector to capture old label
      const currentConnector = await get()._internalGetConnector(diagramId, connectorId);
      if (!currentConnector) {
        throw new Error(`Connector ${connectorId} not found`);
      }

      // Create and execute command
      const command = commandFactory.createUpdateConnectorLabel(
        diagramId,
        connectorId,
        currentConnector.label,
        newLabel
      );
      await commandManager.execute(command, diagramId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update connector label');
      set((state) => ({
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [diagramId]: err },
        },
      }));
      throw error;
    }
  },

  deleteConnector: async (diagramId: string, connectorId: string) => {
    try {
      // Check if this is a sequence diagram before deleting
      const diagram = get().diagrams[diagramId];
      const isSequenceDiagram = diagram?.type === 'sequence';

      // Create and execute command
      const command = commandFactory.createDeleteConnector(diagramId, connectorId);
      await commandManager.execute(command, diagramId);

      // Refresh activation boxes and lifeline heights for sequence diagrams
      if (isSequenceDiagram) {
        // Get updated diagram after deletion
        const updatedDiagram = get().diagrams[diagramId];
        if (updatedDiagram) {
          // Calculate and update lifeline heights first
          const { calculateRequiredLifelineHeight } = await import('~/design-studio/utils/lifelineHeightCalculator');
          const requiredHeight = calculateRequiredLifelineHeight(
            updatedDiagram.shapes,
            updatedDiagram.connectors || []
          );
          const heightCommand = commandFactory.createUpdateLifelineHeights(diagramId, requiredHeight);
          await commandManager.execute(heightCommand, diagramId);

          // Then refresh activation boxes
          const refreshCommand = commandFactory.createRefreshSequenceActivations(diagramId);
          await commandManager.execute(refreshCommand, diagramId);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete connector');
      set((state) => ({
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [diagramId]: err },
        },
      }));
      throw error;
    }
  },

  deleteConnectors: async (diagramId: string, connectorIds: string[]) => {
    try {
      // Create and execute batch delete command (single undo operation)
      const command = commandFactory.createBatchDeleteConnectors(diagramId, connectorIds);
      await commandManager.execute(command, diagramId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete connectors');
      set((state) => ({
        errors: {
          ...state.errors,
          diagrams: { ...state.errors.diagrams, [diagramId]: err },
        },
      }));
      throw error;
    }
  },

  _internalUpdateConnector: async (diagramId: string, connectorId: string, updates: Partial<Connector>) => {
    const updatedDiagram = await diagramApi.updateConnector(diagramId, connectorId, updates);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: {
          ...state.diagrams,
          [diagramId]: updatedDiagram,
        },
      }));
    }

    return updatedDiagram;
  },

  _internalDeleteConnector: async (diagramId: string, connectorId: string) => {
    const updatedDiagram = await diagramApi.deleteConnector(diagramId, connectorId);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: {
          ...state.diagrams,
          [diagramId]: updatedDiagram,
        },
      }));

      // Update canvas instance local state
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      canvasInstance.getState().removeLocalConnector(connectorId);
    }

    return updatedDiagram;
  },

  _internalRestoreConnector: async (diagramId: string, connector: Connector) => {
    const updatedDiagram = await diagramApi.restoreConnector(diagramId, connector);

    if (!updatedDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    set((state) => ({
      diagrams: {
        ...state.diagrams,
        [diagramId]: updatedDiagram,
      },
    }));

    // Update canvas instance local state
    const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
    canvasInstance.getState().addLocalConnector(connector);

    return updatedDiagram;
  },

  _internalGetConnector: async (diagramId: string, connectorId: string) => {
    const diagram = get().diagrams[diagramId];
    if (!diagram) {
      return null;
    }

    const connector = diagram.connectors.find((c) => c.id === connectorId);
    return connector ?? null;
  },

  _internalDeleteConnectorsBatch: async (diagramId: string, connectorIds: string[]) => {
    if (connectorIds.length === 0) {
      return get().diagrams[diagramId] ?? null;
    }

    const updatedDiagram = await diagramApi.deleteConnectorsByIds(diagramId, connectorIds);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: {
          ...state.diagrams,
          [diagramId]: updatedDiagram,
        },
      }));

      // Update canvas instance local state - remove all connectors at once
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      connectorIds.forEach((connectorId) => {
        canvasInstance.getState().removeLocalConnector(connectorId);
      });
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
      diagrams: {
        ...state.diagrams,
        [diagramId]: updatedDiagram,
      },
    }));

    // Update canvas instance local state - add all connectors at once
    const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
    connectors.forEach((connector) => {
      canvasInstance.getState().addLocalConnector(connector);
    });

    return updatedDiagram;
  },

  _internalDeleteShapesBatch: async (diagramId: string, shapeIds: string[]) => {
    if (shapeIds.length === 0) {
      return get().diagrams[diagramId] ?? null;
    }

    const updatedDiagram = await diagramApi.deleteShapesByIds(diagramId, shapeIds);

    if (updatedDiagram) {
      set((state) => ({
        diagrams: {
          ...state.diagrams,
          [diagramId]: updatedDiagram,
        },
      }));

      // Update canvas instance local state - remove all shapes at once
      const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
      shapeIds.forEach((shapeId) => {
        canvasInstance.getState().removeLocalShape(shapeId);
      });
    }

    return updatedDiagram;
  },

  _internalRestoreShapesBatch: async (diagramId: string, shapes: Shape[]) => {
    if (shapes.length === 0) {
      return get().diagrams[diagramId] ?? null;
    }

    const updatedDiagram = await diagramApi.restoreShapes(diagramId, shapes);

    if (!updatedDiagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    set((state) => ({
      diagrams: {
        ...state.diagrams,
        [diagramId]: updatedDiagram,
      },
    }));

    // Update canvas instance local state - add all shapes at once
    const canvasInstance = canvasInstanceRegistry.getStore(diagramId);
    shapes.forEach((shape) => {
      canvasInstance.getState().addLocalShape(shape);
    });

    return updatedDiagram;
  },

  // Utility actions
  // Internal method to update diagram mermaid syntax without triggering loading states
  // Used by useMermaidSync hook to persist cached mermaid export
  _internalUpdateDiagramMermaid: (diagramId: string, mermaidSyntax: string) => {
    const diagram = get().diagrams[diagramId];
    if (diagram) {
      set((state) => ({
        diagrams: {
          ...state.diagrams,
          [diagramId]: {
            ...diagram,
            mermaidSyntax,
            updatedAt: new Date(),
          },
        },
      }));
      // Persist to storage
      diagramApi.update(diagramId, { mermaidSyntax });
    }
  },

  initializeData: () => {
    initializeMockData();
  },
  };
});
