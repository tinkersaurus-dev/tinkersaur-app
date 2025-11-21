import { create } from 'zustand';
import type { Document, CreateDocumentDto } from '../../types';
import { documentApi } from '../../api';

interface DocumentStore {
  // State
  documents: Record<string, Document>; // Indexed by document ID
  loading: Record<string, boolean>; // Per-document loading state
  errors: Record<string, Error | null>; // Per-document error state

  // Actions
  fetchDocument: (id: string) => Promise<void>;
  createDocument: (data: CreateDocumentDto) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial state
  documents: {},
  loading: {},
  errors: {},

  fetchDocument: async (id: string) => {
    // Skip if already loaded
    if (get().documents[id]) {
      return;
    }

    set((state) => ({
      loading: { ...state.loading, [id]: true },
      errors: { ...state.errors, [id]: null },
    }));

    try {
      const document = await documentApi.get(id);
      if (document) {
        set((state) => ({
          documents: { ...state.documents, [id]: document },
          loading: { ...state.loading, [id]: false },
        }));
      } else {
        // Document not found - still need to set loading to false
        set((state) => ({
          loading: { ...state.loading, [id]: false },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch document');
      set((state) => ({
        loading: { ...state.loading, [id]: false },
        errors: { ...state.errors, [id]: err },
      }));
      console.error('Failed to load document:', err);
    }
  },

  createDocument: async (data: CreateDocumentDto) => {
    set((state) => ({
      loading: { ...state.loading, creating: true },
      errors: { ...state.errors, creating: null },
    }));

    try {
      const document = await documentApi.create(data);

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

      // Create document reference
      const documentRef = {
        id: document.id,
        name: document.name,
        order: nextOrder,
      };

      // Add reference to parent DesignWork
      await designWorkStore.addContentReference(data.designWorkId, 'document', documentRef);

      // Update local state
      set((state) => ({
        documents: { ...state.documents, [document.id]: document },
        loading: { ...state.loading, creating: false },
      }));

      return document;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create document');
      set((state) => ({
        loading: { ...state.loading, creating: false },
        errors: { ...state.errors, creating: err },
      }));
      throw error;
    }
  },

  updateDocument: async (id: string, updates: Partial<Document>) => {
    set((state) => ({
      loading: { ...state.loading, [id]: true },
      errors: { ...state.errors, [id]: null },
    }));

    try {
      const updated = await documentApi.update(id, updates);
      if (updated) {
        set((state) => ({
          documents: { ...state.documents, [id]: updated },
          loading: { ...state.loading, [id]: false },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update document');
      set((state) => ({
        loading: { ...state.loading, [id]: false },
        errors: { ...state.errors, [id]: err },
      }));
      throw error;
    }
  },

  deleteDocument: async (id: string) => {
    set((state) => ({
      loading: { ...state.loading, [id]: true },
      errors: { ...state.errors, [id]: null },
    }));

    try {
      await documentApi.delete(id);

      // Import and call DesignWork store to remove reference
      const { useDesignWorkStore } = await import('../design-work/useDesignWorkStore');
      const designWorkStore = useDesignWorkStore.getState();

      // Find parent DesignWork
      const parentDesignWork = designWorkStore.designWorks.find((dw) =>
        dw.documents.some((d) => d.id === id)
      );

      if (parentDesignWork) {
        await designWorkStore.removeContentReference(parentDesignWork.id, 'document', id);
      }

      // Update local state
      set((state) => {
        const newDocuments = { ...state.documents };
        const newLoading = { ...state.loading };
        const newErrors = { ...state.errors };

        delete newDocuments[id];
        delete newLoading[id];
        delete newErrors[id];

        return {
          documents: newDocuments,
          loading: newLoading,
          errors: newErrors,
        };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete document');
      set((state) => ({
        loading: { ...state.loading, [id]: false },
        errors: { ...state.errors, [id]: err },
      }));
      throw error;
    }
  },
}));
