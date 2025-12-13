import { create } from 'zustand';
import type { Document, CreateDocumentDto } from '../../types';
import { documentApi } from '../../api';

interface DocumentStore {
  // State
  documents: Record<string, Document>; // Indexed by document ID
  errors: Record<string, Error | null>; // Per-document error state

  // Hydration - called by TanStack Query to sync fetched data
  setDocument: (document: Document) => void;
  // Clear document from store (called on unmount to ensure fresh data on reopen)
  clearDocument: (id: string) => void;

  // Actions
  createDocument: (data: CreateDocumentDto) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  // Initial state
  documents: {},
  errors: {},

  // Hydration - called by TanStack Query to sync fetched data
  setDocument: (document: Document) => {
    set((state) => ({
      documents: { ...state.documents, [document.id]: document },
    }));
  },

  // Clear document from store (called on unmount to ensure fresh data on reopen)
  clearDocument: (id: string) => {
    set((state) => {
      const newDocuments = { ...state.documents };
      const newErrors = { ...state.errors };
      delete newDocuments[id];
      delete newErrors[id];
      return { documents: newDocuments, errors: newErrors };
    });
  },

  createDocument: async (data: CreateDocumentDto) => {
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
      }));

      return document;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create document');
      set((state) => ({
        errors: { ...state.errors, creating: err },
      }));
      throw error;
    }
  },

  updateDocument: async (id: string, updates: Partial<Document>) => {
    try {
      const updated = await documentApi.update(id, updates);
      if (updated) {
        set((state) => ({
          documents: { ...state.documents, [id]: updated },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update document');
      set((state) => ({
        errors: { ...state.errors, [id]: err },
      }));
      throw error;
    }
  },

  deleteDocument: async (id: string) => {
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
        const newErrors = { ...state.errors };

        delete newDocuments[id];
        delete newErrors[id];

        return {
          documents: newDocuments,
          errors: newErrors,
        };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete document');
      set((state) => ({
        errors: { ...state.errors, [id]: err },
      }));
      throw error;
    }
  },
}));
