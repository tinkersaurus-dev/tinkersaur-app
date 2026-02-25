import type { Diagram, CreateDiagramDto } from '@/entities/diagram';
import { diagramApi } from '@/entities/diagram';
import { commandManager } from '@/shared/model/commands';
import { handleStoreError } from '../utils/errorHandler';
import type { DiagramSlice, DiagramCrudSlice } from '../types';

/**
 * Diagram CRUD slice - hydration and lifecycle operations.
 *
 * Handles diagram creation, updates, deletion, and syncing with TanStack Query.
 * Cross-store coordination with useDesignWorkStore for reference management.
 */
export const createDiagramCrudSlice: DiagramSlice<DiagramCrudSlice> = (set, _get) => ({
  // Diagram hydration - called by TanStack Query to sync fetched data
  setDiagram: (diagram: Diagram) => {
    set((state) => ({
      diagrams: { ...state.diagrams, [diagram.id]: diagram },
    }));
  },

  // Clear diagram from store (called on unmount to ensure fresh data on reopen)
  clearDiagram: (id: string) => {
    set((state) => {
      const newDiagrams = { ...state.diagrams };
      const newErrors = { ...state.errors };
      delete newDiagrams[id];
      delete newErrors[id];
      return { diagrams: newDiagrams, errors: newErrors };
    });
  },

  createDiagram: async (data: CreateDiagramDto) => {
    try {
      const diagram = await diagramApi.create(data);

      // Import and call DesignWork store to add reference
      const { useDesignWorkStore } = await import('@/entities/design-work/store/useDesignWorkStore');
      const designWorkStore = useDesignWorkStore.getState();

      const parentDesignWork = designWorkStore.designWorks.find(
        (dw) => dw.id === data.designWorkId
      );
      if (!parentDesignWork) {
        throw new Error(`DesignWork ${data.designWorkId} not found`);
      }

      // Calculate next order across all content types
      const allOrders = [
        ...parentDesignWork.diagrams.map((d) => d.order),
        ...parentDesignWork.interfaces.map((i) => i.order),
        ...parentDesignWork.documents.map((d) => d.order),
      ];
      const nextOrder = allOrders.length > 0 ? Math.max(...allOrders) + 1 : 0;

      // Create diagram reference
      const diagramRef = {
        id: diagram.id,
        name: diagram.name,
        type: diagram.type,
        order: nextOrder,
      };

      // Add reference to parent DesignWork
      await designWorkStore.addContentReference(data.designWorkId, 'diagram', diagramRef);

      // Update local state
      set((state) => ({
        diagrams: { ...state.diagrams, [diagram.id]: diagram },
      }));

      return diagram;
    } catch (error) {
      handleStoreError(error, set, 'creating', 'Failed to create diagram');
    }
  },

  updateDiagram: async (id: string, updates: Partial<Diagram>) => {
    try {
      const updated = await diagramApi.update(id, updates);
      if (updated) {
        set((state) => ({
          diagrams: { ...state.diagrams, [id]: updated },
        }));
      }
    } catch (error) {
      handleStoreError(error, set, id, 'Failed to update diagram');
    }
  },

  deleteDiagram: async (id: string) => {
    try {
      await diagramApi.delete(id);

      // Clear command history for this diagram
      commandManager.clearScope(id);

      // Import and call DesignWork store to remove reference
      const { useDesignWorkStore } = await import('@/entities/design-work/store/useDesignWorkStore');
      const designWorkStore = useDesignWorkStore.getState();

      // Find parent DesignWork
      const parentDesignWork = designWorkStore.designWorks.find((dw) =>
        dw.diagrams.some((d) => d.id === id)
      );

      if (parentDesignWork) {
        await designWorkStore.removeContentReference(parentDesignWork.id, 'diagram', id);
      }

      // Update local state
      set((state) => {
        const newDiagrams = { ...state.diagrams };
        const newErrors = { ...state.errors };

        delete newDiagrams[id];
        delete newErrors[id];

        return {
          diagrams: newDiagrams,
          errors: newErrors,
        };
      });
    } catch (error) {
      handleStoreError(error, set, id, 'Failed to delete diagram');
    }
  },
});
