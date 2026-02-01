import { create } from 'zustand';
import type { Reference, CreateReference } from '@/entities/reference';
import { referenceApi } from '@/entities/reference';

interface ReferenceStore {
  // State
  references: Record<string, Reference>; // Indexed by reference ID
  error: Error | null;

  // Hydration - called by TanStack Query to sync fetched data
  setReferences: (references: Reference[]) => void;

  // Actions
  createReference: (data: CreateReference) => Promise<Reference>;
  updateReferenceName: (id: string, name: string) => Promise<void>;
  deleteReference: (id: string) => Promise<void>;
  deleteReferenceBySourceShapeId: (sourceShapeId: string) => Promise<void>;
  getReferencesForDiagram: (diagramId: string) => Reference[];
  getReferenceBySourceShapeId: (sourceShapeId: string) => Reference | null;
}

export const useReferenceStore = create<ReferenceStore>((set, get) => ({
  // Initial state
  references: {},
  error: null,

  // Hydration - called by TanStack Query to sync fetched data
  setReferences: (references: Reference[]) => {
    // Index references by ID
    const referencesById = references.reduce(
      (acc, ref) => {
        acc[ref.id] = ref;
        return acc;
      },
      {} as Record<string, Reference>
    );

    set((state) => ({
      references: { ...state.references, ...referencesById },
    }));
  },

  // Create a new reference
  createReference: async (data: CreateReference) => {
    try {
      const reference = await referenceApi.create(data);

      set((state) => ({
        references: { ...state.references, [reference.id]: reference },
      }));

      // References are dynamically displayed under their parent diagrams,
      // so we don't need to store them in DesignWork

      return reference;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create reference');
      set({ error: err });
      throw error;
    }
  },

  // Update reference name (when source shape label changes)
  updateReferenceName: async (id: string, name: string) => {
    try {
      const updatedReference = await referenceApi.update(id, { name });

      if (updatedReference) {
        set((state) => ({
          references: { ...state.references, [id]: updatedReference },
        }));
      } else {
        throw new Error(`Reference ${id} not found`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update reference name');
      set({ error: err });
      throw error;
    }
  },

  // Delete a reference
  deleteReference: async (id: string) => {
    try {
      const reference = get().references[id];
      if (!reference) {
        throw new Error(`Reference ${id} not found`);
      }

      await referenceApi.delete(id);

      // Remove from local state
      set((state) => {
        const { [id]: _removed, ...remaining } = state.references;
        return { references: remaining };
      });

      // References are dynamically displayed under their parent diagrams,
      // so we don't need to update DesignWork
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete reference');
      set({ error: err });
      throw error;
    }
  },

  // Delete a reference by source shape ID (when shape is deleted)
  deleteReferenceBySourceShapeId: async (sourceShapeId: string) => {
    const reference = get().getReferenceBySourceShapeId(sourceShapeId);
    if (reference) {
      await get().deleteReference(reference.id);
    }
  },

  // Get all references for a specific diagram
  getReferencesForDiagram: (diagramId: string) => {
    return Object.values(get().references).filter((ref) => ref.contentId === diagramId);
  },

  // Get a reference by its source shape ID
  getReferenceBySourceShapeId: (sourceShapeId: string) => {
    return Object.values(get().references).find((ref) => ref.sourceShapeId === sourceShapeId) || null;
  },
}));
