import { create } from 'zustand';
import type { DesignWork, CreateDesignWorkDto, DiagramRef, InterfaceRef, DocumentRef } from '../../types';
import type { ReferenceRef } from '../../types/Reference';
import { designWorkApi, diagramApi, interfaceApi, documentApi } from '../../api';
import type { ReorderItemDto } from '../../api/designWorkApi';
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

  // Reorder action for drag-and-drop
  reorderItems: (items: ReorderItemDto[]) => Promise<void>;

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
      await designWorkApi.update(id, updates);
      // Apply only the updates that were sent, preserving all other fields
      set((state) => ({
        designWorks: state.designWorks.map((dw) =>
          dw.id === id ? { ...dw, ...updates } : dw
        ),
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update design work');
      set({ error: err });
      throw error;
    }
  },

  reorderItems: async (items: ReorderItemDto[]) => {
    try {
      // Optimistically update local state with sibling shifting
      // IMPORTANT: Unified ordering means ALL item types at a level share the same order space
      set((state) => {
        const newDesignWorks = state.designWorks.map((dw) => ({
          ...dw,
          diagrams: [...dw.diagrams],
          interfaces: [...dw.interfaces],
          documents: [...dw.documents],
        }));

        // Helper to shift all siblings at a parent level within a range
        const shiftAllSiblingsInRange = (parentId: string | undefined, fromOrder: number, toOrder: number, delta: number, excludeId: string) => {
          // Shift child folders
          newDesignWorks.forEach((dw) => {
            if (dw.parentDesignWorkId === parentId && dw.id !== excludeId && dw.order >= fromOrder && dw.order <= toOrder) {
              dw.order += delta;
            }
          });
          // Shift content items in the parent folder
          if (parentId) {
            const parent = newDesignWorks.find((dw) => dw.id === parentId);
            if (parent) {
              parent.diagrams.forEach((d) => {
                if (d.id !== excludeId && d.order >= fromOrder && d.order <= toOrder) d.order += delta;
              });
              parent.interfaces.forEach((i) => {
                if (i.id !== excludeId && i.order >= fromOrder && i.order <= toOrder) i.order += delta;
              });
              parent.documents.forEach((d) => {
                if (d.id !== excludeId && d.order >= fromOrder && d.order <= toOrder) d.order += delta;
              });
            }
          }
        };

        // Helper to shift all siblings after a position
        const shiftAllSiblingsAfter = (parentId: string | undefined, afterOrder: number, delta: number, excludeId: string) => {
          newDesignWorks.forEach((dw) => {
            if (dw.parentDesignWorkId === parentId && dw.id !== excludeId && dw.order > afterOrder) {
              dw.order += delta;
            }
          });
          if (parentId) {
            const parent = newDesignWorks.find((dw) => dw.id === parentId);
            if (parent) {
              parent.diagrams.forEach((d) => {
                if (d.id !== excludeId && d.order > afterOrder) d.order += delta;
              });
              parent.interfaces.forEach((i) => {
                if (i.id !== excludeId && i.order > afterOrder) i.order += delta;
              });
              parent.documents.forEach((d) => {
                if (d.id !== excludeId && d.order > afterOrder) d.order += delta;
              });
            }
          }
        };

        // Helper to shift all siblings at or after a position
        const shiftAllSiblingsAtOrAfter = (parentId: string | undefined, atOrder: number, delta: number, excludeId: string) => {
          newDesignWorks.forEach((dw) => {
            if (dw.parentDesignWorkId === parentId && dw.id !== excludeId && dw.order >= atOrder) {
              dw.order += delta;
            }
          });
          if (parentId) {
            const parent = newDesignWorks.find((dw) => dw.id === parentId);
            if (parent) {
              parent.diagrams.forEach((d) => {
                if (d.id !== excludeId && d.order >= atOrder) d.order += delta;
              });
              parent.interfaces.forEach((i) => {
                if (i.id !== excludeId && i.order >= atOrder) i.order += delta;
              });
              parent.documents.forEach((d) => {
                if (d.id !== excludeId && d.order >= atOrder) d.order += delta;
              });
            }
          }
        };

        for (const item of items) {
          if (item.itemType === 'folder') {
            // Handle folder reordering
            const folderIndex = newDesignWorks.findIndex((dw) => dw.id === item.id);
            if (folderIndex === -1) continue;

            const folder = newDesignWorks[folderIndex];
            const oldOrder = folder.order;
            const oldParentId = folder.parentDesignWorkId;
            const newParentId = item.newParentDesignWorkId;
            const newOrder = item.newOrder;
            const isMovingToNewParent = oldParentId !== newParentId;

            if (!isMovingToNewParent) {
              // Same parent - shift siblings between old and new position
              if (newOrder < oldOrder) {
                shiftAllSiblingsInRange(oldParentId, newOrder, oldOrder - 1, 1, item.id);
              } else if (newOrder > oldOrder) {
                shiftAllSiblingsInRange(oldParentId, oldOrder + 1, newOrder, -1, item.id);
              }
            } else {
              // Moving to new parent
              shiftAllSiblingsAfter(oldParentId, oldOrder, -1, item.id);
              shiftAllSiblingsAtOrAfter(newParentId, newOrder, 1, item.id);
            }

            // Update the folder itself
            newDesignWorks[folderIndex] = {
              ...folder,
              order: newOrder,
              parentDesignWorkId: newParentId,
            };
          } else {
            // Handle content item reordering (diagram, interface, document)
            const contentKey = item.itemType === 'diagram' ? 'diagrams' : item.itemType === 'interface' ? 'interfaces' : 'documents';

            // Find which folder contains this content item
            let oldParentIndex = -1;
            let contentIndex = -1;
            for (let i = 0; i < newDesignWorks.length; i++) {
              const contentArray = newDesignWorks[i][contentKey] as Array<{ id: string; order: number }>;
              const idx = contentArray.findIndex((c) => c.id === item.id);
              if (idx !== -1) {
                oldParentIndex = i;
                contentIndex = idx;
                break;
              }
            }

            if (oldParentIndex === -1 || contentIndex === -1) continue;

            const oldParent = newDesignWorks[oldParentIndex];
            const contentArray = oldParent[contentKey] as Array<{ id: string; order: number; [key: string]: unknown }>;
            const contentItem = contentArray[contentIndex];
            const oldOrder = contentItem.order;
            const newOrder = item.newOrder;
            const newParentId = item.newParentDesignWorkId ?? oldParent.id;
            const isMovingToNewParent = newParentId !== oldParent.id;

            if (!isMovingToNewParent) {
              // Same folder - shift all siblings between old and new position
              if (newOrder < oldOrder) {
                shiftAllSiblingsInRange(oldParent.id, newOrder, oldOrder - 1, 1, item.id);
              } else if (newOrder > oldOrder) {
                shiftAllSiblingsInRange(oldParent.id, oldOrder + 1, newOrder, -1, item.id);
              }
              // Update the item itself
              contentArray[contentIndex] = { ...contentItem, order: newOrder };
            } else {
              // Moving to new parent
              // Close gap in old parent (shift all item types)
              shiftAllSiblingsAfter(oldParent.id, oldOrder, -1, item.id);
              // Remove from old parent
              newDesignWorks[oldParentIndex] = {
                ...oldParent,
                [contentKey]: contentArray.filter((c) => c.id !== item.id),
              };

              // Make room in new parent (shift all item types)
              shiftAllSiblingsAtOrAfter(newParentId, newOrder, 1, item.id);
              // Add to new parent
              const newParentIndex = newDesignWorks.findIndex((d) => d.id === newParentId);
              if (newParentIndex !== -1) {
                const newParent = newDesignWorks[newParentIndex];
                newDesignWorks[newParentIndex] = {
                  ...newParent,
                  [contentKey]: [...(newParent[contentKey] as Array<{ id: string; order: number; [key: string]: unknown }>), { ...contentItem, order: newOrder }],
                };
              }
            }
          }
        }

        return { designWorks: newDesignWorks };
      });

      // Persist to API
      await designWorkApi.reorder(items);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to reorder items');
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
