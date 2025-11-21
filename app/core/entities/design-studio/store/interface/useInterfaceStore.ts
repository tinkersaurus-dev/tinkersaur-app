import { create } from 'zustand';
import type { Interface, CreateInterfaceDto } from '../../types';
import { interfaceApi } from '../../api';

interface InterfaceStore {
  // State
  interfaces: Record<string, Interface>; // Indexed by interface ID
  loading: Record<string, boolean>; // Per-interface loading state
  errors: Record<string, Error | null>; // Per-interface error state

  // Actions
  fetchInterface: (id: string) => Promise<void>;
  createInterface: (data: CreateInterfaceDto) => Promise<Interface>;
  updateInterface: (id: string, updates: Partial<Interface>) => Promise<void>;
  deleteInterface: (id: string) => Promise<void>;
}

export const useInterfaceStore = create<InterfaceStore>((set, get) => ({
  // Initial state
  interfaces: {},
  loading: {},
  errors: {},

  fetchInterface: async (id: string) => {
    // Skip if already loaded
    if (get().interfaces[id]) {
      return;
    }

    set((state) => ({
      loading: { ...state.loading, [id]: true },
      errors: { ...state.errors, [id]: null },
    }));

    try {
      const interfaceItem = await interfaceApi.get(id);
      if (interfaceItem) {
        set((state) => ({
          interfaces: { ...state.interfaces, [id]: interfaceItem },
          loading: { ...state.loading, [id]: false },
        }));
      } else {
        // Interface not found - still need to set loading to false
        set((state) => ({
          loading: { ...state.loading, [id]: false },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch interface');
      set((state) => ({
        loading: { ...state.loading, [id]: false },
        errors: { ...state.errors, [id]: err },
      }));
      console.error('Failed to load interface:', err);
    }
  },

  createInterface: async (data: CreateInterfaceDto) => {
    set((state) => ({
      loading: { ...state.loading, creating: true },
      errors: { ...state.errors, creating: null },
    }));

    try {
      const interfaceItem = await interfaceApi.create(data);

      // Import and call DesignWork store to add reference
      const { useDesignWorkStore } = await import('../design-work/useDesignWorkStore');
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

      // Create interface reference
      const interfaceRef = {
        id: interfaceItem.id,
        name: interfaceItem.name,
        fidelity: interfaceItem.fidelity,
        order: nextOrder,
      };

      // Add reference to parent DesignWork
      await designWorkStore.addContentReference(data.designWorkId, 'interface', interfaceRef);

      // Update local state
      set((state) => ({
        interfaces: { ...state.interfaces, [interfaceItem.id]: interfaceItem },
        loading: { ...state.loading, creating: false },
      }));

      return interfaceItem;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create interface');
      set((state) => ({
        loading: { ...state.loading, creating: false },
        errors: { ...state.errors, creating: err },
      }));
      throw error;
    }
  },

  updateInterface: async (id: string, updates: Partial<Interface>) => {
    set((state) => ({
      loading: { ...state.loading, [id]: true },
      errors: { ...state.errors, [id]: null },
    }));

    try {
      const updated = await interfaceApi.update(id, updates);
      if (updated) {
        set((state) => ({
          interfaces: { ...state.interfaces, [id]: updated },
          loading: { ...state.loading, [id]: false },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update interface');
      set((state) => ({
        loading: { ...state.loading, [id]: false },
        errors: { ...state.errors, [id]: err },
      }));
      throw error;
    }
  },

  deleteInterface: async (id: string) => {
    set((state) => ({
      loading: { ...state.loading, [id]: true },
      errors: { ...state.errors, [id]: null },
    }));

    try {
      await interfaceApi.delete(id);

      // Import and call DesignWork store to remove reference
      const { useDesignWorkStore } = await import('../design-work/useDesignWorkStore');
      const designWorkStore = useDesignWorkStore.getState();

      // Find parent DesignWork
      const parentDesignWork = designWorkStore.designWorks.find((dw) =>
        dw.interfaces.some((i) => i.id === id)
      );

      if (parentDesignWork) {
        await designWorkStore.removeContentReference(parentDesignWork.id, 'interface', id);
      }

      // Update local state
      set((state) => {
        const newInterfaces = { ...state.interfaces };
        const newLoading = { ...state.loading };
        const newErrors = { ...state.errors };

        delete newInterfaces[id];
        delete newLoading[id];
        delete newErrors[id];

        return {
          interfaces: newInterfaces,
          loading: newLoading,
          errors: newErrors,
        };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete interface');
      set((state) => ({
        loading: { ...state.loading, [id]: false },
        errors: { ...state.errors, [id]: err },
      }));
      throw error;
    }
  },
}));
