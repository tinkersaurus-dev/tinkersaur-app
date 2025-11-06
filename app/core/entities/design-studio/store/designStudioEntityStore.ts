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
} from '../types';
import { designWorkApi, diagramApi, interfaceApi, documentApi, initializeMockData } from '../api';

interface DesignStudioEntityStore {
  // Entity state
  designWorks: DesignWork[];
  diagrams: Diagram[];
  interfaces: Interface[];
  documents: Document[];

  // Loading states (per-entity)
  loading: {
    designWorks: boolean;
    diagrams: boolean;
    interfaces: boolean;
    documents: boolean;
  };

  // Error states (per-entity)
  errors: {
    designWorks: Error | null;
    diagrams: Error | null;
    interfaces: Error | null;
    documents: Error | null;
  };

  // DesignWork actions
  fetchDesignWorks: (solutionId: string) => Promise<void>;
  createDesignWork: (data: CreateDesignWorkDto) => Promise<DesignWork>;
  updateDesignWork: (id: string, updates: Partial<DesignWork>) => Promise<void>;
  deleteDesignWork: (id: string) => Promise<void>;

  // Diagram actions
  fetchDiagrams: (solutionId: string) => Promise<void>;
  createDiagram: (data: CreateDiagramDto) => Promise<Diagram>;
  updateDiagram: (id: string, updates: Partial<Diagram>) => Promise<void>;
  deleteDiagram: (id: string) => Promise<void>;

  // Interface actions
  fetchInterfaces: (solutionId: string) => Promise<void>;
  createInterface: (data: CreateInterfaceDto) => Promise<Interface>;
  updateInterface: (id: string, updates: Partial<Interface>) => Promise<void>;
  deleteInterface: (id: string) => Promise<void>;

  // Document actions
  fetchDocuments: (solutionId: string) => Promise<void>;
  createDocument: (data: CreateDocumentDto) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  // Utility actions
  initializeData: () => void;
}

// Initialize mock data on module load
initializeMockData();

export const useDesignStudioEntityStore = create<DesignStudioEntityStore>((set, get) => ({
  // Initial state
  designWorks: [],
  diagrams: [],
  interfaces: [],
  documents: [],

  loading: {
    designWorks: false,
    diagrams: false,
    interfaces: false,
    documents: false,
  },

  errors: {
    designWorks: null,
    diagrams: null,
    interfaces: null,
    documents: null,
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

      // Delete all related content
      for (const designWorkId of allIdsToDelete) {
        await diagramApi.deleteByDesignWorkId(designWorkId);
        await interfaceApi.deleteByDesignWorkId(designWorkId);
        await documentApi.deleteByDesignWorkId(designWorkId);
      }

      // Update local state
      set((state) => ({
        designWorks: state.designWorks.filter((dw) => !allIdsToDelete.includes(dw.id)),
        diagrams: state.diagrams.filter((d) => !allIdsToDelete.includes(d.designWorkId)),
        interfaces: state.interfaces.filter((i) => !allIdsToDelete.includes(i.designWorkId)),
        documents: state.documents.filter((d) => !allIdsToDelete.includes(d.designWorkId)),
        loading: { ...state.loading, designWorks: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete design work');
      set((state) => ({
        loading: { ...state.loading, designWorks: false },
        errors: { ...state.errors, designWorks: err },
      }));
      throw error;
    }
  },

  // Diagram actions
  fetchDiagrams: async (solutionId: string) => {
    set((state) => ({
      loading: { ...state.loading, diagrams: true },
      errors: { ...state.errors, diagrams: null },
    }));

    try {
      // Fetch all diagrams and filter by solution's design works
      const allDiagrams = await diagramApi.listAll();
      const designWorkIds = get().designWorks
        .filter((dw) => dw.solutionId === solutionId)
        .map((dw) => dw.id);
      const diagrams = allDiagrams.filter((d) => designWorkIds.includes(d.designWorkId));

      set((state) => ({
        diagrams,
        loading: { ...state.loading, diagrams: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch diagrams');
      set((state) => ({
        loading: { ...state.loading, diagrams: false },
        errors: { ...state.errors, diagrams: err },
      }));
      console.error('Failed to load diagrams:', err);
    }
  },

  createDiagram: async (data: CreateDiagramDto) => {
    set((state) => ({
      loading: { ...state.loading, diagrams: true },
      errors: { ...state.errors, diagrams: null },
    }));

    try {
      const diagram = await diagramApi.create(data);
      set((state) => ({
        diagrams: [...state.diagrams, diagram],
        loading: { ...state.loading, diagrams: false },
      }));
      return diagram;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create diagram');
      set((state) => ({
        loading: { ...state.loading, diagrams: false },
        errors: { ...state.errors, diagrams: err },
      }));
      throw error;
    }
  },

  updateDiagram: async (id: string, updates: Partial<Diagram>) => {
    set((state) => ({
      loading: { ...state.loading, diagrams: true },
      errors: { ...state.errors, diagrams: null },
    }));

    try {
      const updated = await diagramApi.update(id, updates);
      if (updated) {
        set((state) => ({
          diagrams: state.diagrams.map((d) => (d.id === id ? updated : d)),
          loading: { ...state.loading, diagrams: false },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update diagram');
      set((state) => ({
        loading: { ...state.loading, diagrams: false },
        errors: { ...state.errors, diagrams: err },
      }));
      throw error;
    }
  },

  deleteDiagram: async (id: string) => {
    set((state) => ({
      loading: { ...state.loading, diagrams: true },
      errors: { ...state.errors, diagrams: null },
    }));

    try {
      await diagramApi.delete(id);
      set((state) => ({
        diagrams: state.diagrams.filter((d) => d.id !== id),
        loading: { ...state.loading, diagrams: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete diagram');
      set((state) => ({
        loading: { ...state.loading, diagrams: false },
        errors: { ...state.errors, diagrams: err },
      }));
      throw error;
    }
  },

  // Interface actions
  fetchInterfaces: async (solutionId: string) => {
    set((state) => ({
      loading: { ...state.loading, interfaces: true },
      errors: { ...state.errors, interfaces: null },
    }));

    try {
      // Fetch all interfaces and filter by solution's design works
      const allInterfaces = await interfaceApi.listAll();
      const designWorkIds = get().designWorks
        .filter((dw) => dw.solutionId === solutionId)
        .map((dw) => dw.id);
      const interfaces = allInterfaces.filter((i) => designWorkIds.includes(i.designWorkId));

      set((state) => ({
        interfaces,
        loading: { ...state.loading, interfaces: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch interfaces');
      set((state) => ({
        loading: { ...state.loading, interfaces: false },
        errors: { ...state.errors, interfaces: err },
      }));
      console.error('Failed to load interfaces:', err);
    }
  },

  createInterface: async (data: CreateInterfaceDto) => {
    set((state) => ({
      loading: { ...state.loading, interfaces: true },
      errors: { ...state.errors, interfaces: null },
    }));

    try {
      const interfaceItem = await interfaceApi.create(data);
      set((state) => ({
        interfaces: [...state.interfaces, interfaceItem],
        loading: { ...state.loading, interfaces: false },
      }));
      return interfaceItem;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create interface');
      set((state) => ({
        loading: { ...state.loading, interfaces: false },
        errors: { ...state.errors, interfaces: err },
      }));
      throw error;
    }
  },

  updateInterface: async (id: string, updates: Partial<Interface>) => {
    set((state) => ({
      loading: { ...state.loading, interfaces: true },
      errors: { ...state.errors, interfaces: null },
    }));

    try {
      const updated = await interfaceApi.update(id, updates);
      if (updated) {
        set((state) => ({
          interfaces: state.interfaces.map((i) => (i.id === id ? updated : i)),
          loading: { ...state.loading, interfaces: false },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update interface');
      set((state) => ({
        loading: { ...state.loading, interfaces: false },
        errors: { ...state.errors, interfaces: err },
      }));
      throw error;
    }
  },

  deleteInterface: async (id: string) => {
    set((state) => ({
      loading: { ...state.loading, interfaces: true },
      errors: { ...state.errors, interfaces: null },
    }));

    try {
      await interfaceApi.delete(id);
      set((state) => ({
        interfaces: state.interfaces.filter((i) => i.id !== id),
        loading: { ...state.loading, interfaces: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete interface');
      set((state) => ({
        loading: { ...state.loading, interfaces: false },
        errors: { ...state.errors, interfaces: err },
      }));
      throw error;
    }
  },

  // Document actions
  fetchDocuments: async (solutionId: string) => {
    set((state) => ({
      loading: { ...state.loading, documents: true },
      errors: { ...state.errors, documents: null },
    }));

    try {
      // Fetch all documents and filter by solution's design works
      const allDocuments = await documentApi.listAll();
      const designWorkIds = get().designWorks
        .filter((dw) => dw.solutionId === solutionId)
        .map((dw) => dw.id);
      const documents = allDocuments.filter((d) => designWorkIds.includes(d.designWorkId));

      set((state) => ({
        documents,
        loading: { ...state.loading, documents: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch documents');
      set((state) => ({
        loading: { ...state.loading, documents: false },
        errors: { ...state.errors, documents: err },
      }));
      console.error('Failed to load documents:', err);
    }
  },

  createDocument: async (data: CreateDocumentDto) => {
    set((state) => ({
      loading: { ...state.loading, documents: true },
      errors: { ...state.errors, documents: null },
    }));

    try {
      const document = await documentApi.create(data);
      set((state) => ({
        documents: [...state.documents, document],
        loading: { ...state.loading, documents: false },
      }));
      return document;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create document');
      set((state) => ({
        loading: { ...state.loading, documents: false },
        errors: { ...state.errors, documents: err },
      }));
      throw error;
    }
  },

  updateDocument: async (id: string, updates: Partial<Document>) => {
    set((state) => ({
      loading: { ...state.loading, documents: true },
      errors: { ...state.errors, documents: null },
    }));

    try {
      const updated = await documentApi.update(id, updates);
      if (updated) {
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? updated : d)),
          loading: { ...state.loading, documents: false },
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update document');
      set((state) => ({
        loading: { ...state.loading, documents: false },
        errors: { ...state.errors, documents: err },
      }));
      throw error;
    }
  },

  deleteDocument: async (id: string) => {
    set((state) => ({
      loading: { ...state.loading, documents: true },
      errors: { ...state.errors, documents: null },
    }));

    try {
      await documentApi.delete(id);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        loading: { ...state.loading, documents: false },
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete document');
      set((state) => ({
        loading: { ...state.loading, documents: false },
        errors: { ...state.errors, documents: err },
      }));
      throw error;
    }
  },

  // Utility actions
  initializeData: () => {
    initializeMockData();
  },
}));
