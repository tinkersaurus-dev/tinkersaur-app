import { create } from 'zustand';
import type { Interface, CreateInterfaceDto } from '@/entities/interface';
import { interfaceApi } from '@/entities/interface';

interface InterfaceStore {
  // State
  interfaces: Record<string, Interface>; // Indexed by interface ID
  errors: Record<string, Error | null>; // Per-interface error state

  // Hydration - called by TanStack Query to sync fetched data
  setInterface: (interfaceItem: Interface) => void;
  // Clear interface from store (called on unmount to ensure fresh data on reopen)
  clearInterface: (id: string) => void;

  // Actions
  createInterface: (data: CreateInterfaceDto) => Promise<Interface>;
  updateInterface: (id: string, updates: Partial<Interface>) => Promise<void>;
  deleteInterface: (id: string) => Promise<void>;
}

export const useInterfaceStore = create<InterfaceStore>((set) => ({
  // Initial state
  interfaces: {},
  errors: {},

  // Hydration - called by TanStack Query to sync fetched data
  setInterface: (interfaceItem: Interface) => {
    set((state) => ({
      interfaces: { ...state.interfaces, [interfaceItem.id]: interfaceItem },
    }));
  },

  // Clear interface from store (called on unmount to ensure fresh data on reopen)
  clearInterface: (id: string) => {
    set((state) => {
      const newInterfaces = { ...state.interfaces };
      const newErrors = { ...state.errors };
      delete newInterfaces[id];
      delete newErrors[id];
      return { interfaces: newInterfaces, errors: newErrors };
    });
  },

  createInterface: async (data: CreateInterfaceDto) => {
    try {
      const interfaceItem = await interfaceApi.create(data);

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
      }));

      return interfaceItem;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create interface');
      set((state) => ({
        errors: { ...state.errors, creating: err },
      }));
      throw error;
    }
  },

  updateInterface: async (id: string, updates: Partial<Interface>) => {
    try {
      const updated = await interfaceApi.update(id, updates);
      if (updated) {
        set((state) => ({
          interfaces: { ...state.interfaces, [id]: updated },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update interface');
      set((state) => ({
        errors: { ...state.errors, [id]: err },
      }));
      throw error;
    }
  },

  deleteInterface: async (id: string) => {
    try {
      await interfaceApi.delete(id);

      // Import and call DesignWork store to remove reference
      const { useDesignWorkStore } = await import('@/entities/design-work/store/useDesignWorkStore');
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
        const newErrors = { ...state.errors };

        delete newInterfaces[id];
        delete newErrors[id];

        return {
          interfaces: newInterfaces,
          errors: newErrors,
        };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete interface');
      set((state) => ({
        errors: { ...state.errors, [id]: err },
      }));
      throw error;
    }
  },
}));
