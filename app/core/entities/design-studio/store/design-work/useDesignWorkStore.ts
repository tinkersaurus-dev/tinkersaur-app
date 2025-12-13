import { create } from 'zustand';
import type { DesignWork, CreateDesignWorkDto, DiagramRef, InterfaceRef, DocumentRef } from '../../types';
import type { ReferenceRef } from '../../types/Reference';
import { designWorkApi, diagramApi, interfaceApi, documentApi } from '../../api';
import { commandManager } from '~/core/commands/CommandManager';

interface DesignWorkStore {
  // State
  designWorks: DesignWork[];
  error: Error | null;

  // Hydration - called by TanStack Query to sync fetched data
  setDesignWorks: (designWorks: DesignWork[]) => void;

  // Actions
  createDesignWork: (data: CreateDesignWorkDto) => Promise<DesignWork>;
  updateDesignWork: (id: string, updates: Partial<DesignWork>) => Promise<void>;
  deleteDesignWork: (id: string) => Promise<void>;

  // Helper actions for cross-store coordination
  addContentReference: (
    designWorkId: string,
    contentType: 'diagram' | 'interface' | 'document' | 'reference',
    contentRef: { id: string; name: string; order: number; [key: string]: unknown }
  ) => Promise<void>;
  removeContentReference: (
    designWorkId: string,
    contentType: 'diagram' | 'interface' | 'document' | 'reference',
    contentId: string
  ) => Promise<void>;
}

export const useDesignWorkStore = create<DesignWorkStore>((set, get) => ({
  // Initial state
  designWorks: [],
  error: null,

  // Hydration - called by TanStack Query to sync fetched data
  setDesignWorks: (designWorks: DesignWork[]) => {
    set({ designWorks });
  },

  createDesignWork: async (data: CreateDesignWorkDto) => {
    try {
      const designWork = await designWorkApi.create(data);
      set((state) => ({
        designWorks: [...state.designWorks, designWork],
      }));
      return designWork;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create design work');
      set({ error: err });
      throw error;
    }
  },

  updateDesignWork: async (id: string, updates: Partial<DesignWork>) => {
    try {
      const updated = await designWorkApi.update(id, updates);
      if (updated) {
        set((state) => ({
          designWorks: state.designWorks.map((dw) => (dw.id === id ? updated : dw)),
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update design work');
      set({ error: err });
      throw error;
    }
  },

  deleteDesignWork: async (id: string) => {
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
        const designWork = get().designWorks.find((dw) => dw.id === designWorkId);
        if (designWork) {
          designWork.diagrams.forEach((ref) => allDiagramIds.push(ref.id));
        }
      }

      // Clear command histories for all diagrams before deletion
      allDiagramIds.forEach((diagramId) => {
        commandManager.clearScope(diagramId);
      });

      // Delete all related content from their respective stores
      // Note: In the original implementation, this deleted from APIs
      // Now we need to coordinate with other stores
      for (const designWorkId of allIdsToDelete) {
        await diagramApi.deleteByDesignWorkId(designWorkId);
        await interfaceApi.deleteByDesignWorkId(designWorkId);
        await documentApi.deleteByDesignWorkId(designWorkId);
      }

      // Update local state - filter designWorks array
      set((state) => ({
        designWorks: state.designWorks.filter((dw) => !allIdsToDelete.includes(dw.id)),
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete design work');
      set({ error: err });
      throw error;
    }
  },

  // Helper action to add content reference (called by content stores when creating)
  addContentReference: async (
    designWorkId: string,
    contentType: 'diagram' | 'interface' | 'document' | 'reference',
    contentRef: { id: string; name: string; order: number; [key: string]: unknown }
  ) => {
    const designWork = get().designWorks.find((dw) => dw.id === designWorkId);
    if (!designWork) {
      throw new Error(`DesignWork ${designWorkId} not found`);
    }

    // Update the appropriate array based on content type
    const updatedDesignWork = {
      ...designWork,
      diagrams: contentType === 'diagram' ? [...designWork.diagrams, contentRef as DiagramRef] : designWork.diagrams,
      interfaces: contentType === 'interface' ? [...designWork.interfaces, contentRef as InterfaceRef] : designWork.interfaces,
      documents: contentType === 'document' ? [...designWork.documents, contentRef as DocumentRef] : designWork.documents,
      references: contentType === 'reference' ? [...(designWork.references || []), contentRef as ReferenceRef] : (designWork.references || []),
    };

    // Persist to API
    await designWorkApi.update(designWorkId, updatedDesignWork);

    // Update local state
    set((state) => ({
      designWorks: state.designWorks.map((dw) => (dw.id === designWorkId ? updatedDesignWork : dw)),
    }));
  },

  // Helper action to remove content reference (called by content stores when deleting)
  removeContentReference: async (
    designWorkId: string,
    contentType: 'diagram' | 'interface' | 'document' | 'reference',
    contentId: string
  ) => {
    const designWork = get().designWorks.find((dw) => dw.id === designWorkId);
    if (!designWork) {
      return; // DesignWork might have been deleted
    }

    // Update the appropriate array based on content type
    const updatedDesignWork = {
      ...designWork,
      diagrams: contentType === 'diagram' ? designWork.diagrams.filter((d) => d.id !== contentId) : designWork.diagrams,
      interfaces: contentType === 'interface' ? designWork.interfaces.filter((i) => i.id !== contentId) : designWork.interfaces,
      documents: contentType === 'document' ? designWork.documents.filter((d) => d.id !== contentId) : designWork.documents,
      references: contentType === 'reference' ? (designWork.references || []).filter((r) => r.id !== contentId) : (designWork.references || []),
    };

    // Persist to API
    await designWorkApi.update(designWorkId, updatedDesignWork);

    // Update local state
    set((state) => ({
      designWorks: state.designWorks.map((dw) => (dw.id === designWorkId ? updatedDesignWork : dw)),
    }));
  },
}));
