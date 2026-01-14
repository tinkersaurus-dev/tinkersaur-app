import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useDiagramStore,
  useInterfaceStore,
  useDocumentStore,
  type CreateDesignWorkDto,
  type CreateDiagramDto,
  type CreateInterfaceDto,
  type CreateDocumentDto,
  type DesignWork,
  type Diagram,
  type Interface,
  type Document,
} from '~/core/entities/design-studio';
import { useDesignWorkStore } from '~/core/entities/design-studio/store/design-work/useDesignWorkStore';
import { queryKeys } from '~/core/query/queryKeys';

/**
 * Hook providing CRUD operations for all design studio entities
 * Combines entity store operations in a convenient interface
 * Invalidates TanStack Query cache after mutations to keep data in sync
 */
export function useDesignStudioCRUD() {
  const queryClient = useQueryClient();

  // DesignWork operations
  const createDesignWork = useDesignWorkStore((state) => state.createDesignWork);
  const updateDesignWork = useDesignWorkStore((state) => state.updateDesignWork);
  const deleteDesignWork = useDesignWorkStore((state) => state.deleteDesignWork);

  // Helper to invalidate all design work queries
  const invalidateDesignWorkQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.designWorks.all });
  }, [queryClient]);

  // Diagram operations
  const createDiagram = useDiagramStore((state) => state.createDiagram);
  const updateDiagram = useDiagramStore((state) => state.updateDiagram);
  const deleteDiagram = useDiagramStore((state) => state.deleteDiagram);

  // Interface operations
  const createInterface = useInterfaceStore((state) => state.createInterface);
  const updateInterface = useInterfaceStore((state) => state.updateInterface);
  const deleteInterface = useInterfaceStore((state) => state.deleteInterface);

  // Document operations
  const createDocument = useDocumentStore((state) => state.createDocument);
  const updateDocument = useDocumentStore((state) => state.updateDocument);
  const deleteDocument = useDocumentStore((state) => state.deleteDocument);

  // DesignWork handlers
  const handleCreateDesignWork = useCallback(
    async (data: CreateDesignWorkDto) => {
      const result = await createDesignWork(data);
      invalidateDesignWorkQueries();
      return result;
    },
    [createDesignWork, invalidateDesignWorkQueries]
  );

  const handleUpdateDesignWork = useCallback(
    async (id: string, updates: Partial<DesignWork>) => {
      await updateDesignWork(id, updates);
      invalidateDesignWorkQueries();
    },
    [updateDesignWork, invalidateDesignWorkQueries]
  );

  const handleDeleteDesignWork = useCallback(
    async (id: string) => {
      await deleteDesignWork(id);
      invalidateDesignWorkQueries();
    },
    [deleteDesignWork, invalidateDesignWorkQueries]
  );

  // Diagram handlers
  const handleCreateDiagram = useCallback(
    async (data: CreateDiagramDto) => {
      const result = await createDiagram(data);
      invalidateDesignWorkQueries();
      queryClient.invalidateQueries({ queryKey: queryKeys.diagrams.detail(result.id) });
      return result;
    },
    [createDiagram, invalidateDesignWorkQueries, queryClient]
  );

  const handleUpdateDiagram = useCallback(
    async (id: string, updates: Partial<Diagram>) => {
      await updateDiagram(id, updates);
      queryClient.invalidateQueries({ queryKey: queryKeys.diagrams.detail(id) });
    },
    [updateDiagram, queryClient]
  );

  const handleDeleteDiagram = useCallback(
    async (id: string) => {
      await deleteDiagram(id);
      invalidateDesignWorkQueries();
      queryClient.invalidateQueries({ queryKey: queryKeys.diagrams.detail(id) });
    },
    [deleteDiagram, invalidateDesignWorkQueries, queryClient]
  );

  // Interface handlers
  const handleCreateInterface = useCallback(
    async (data: CreateInterfaceDto) => {
      const result = await createInterface(data);
      invalidateDesignWorkQueries();
      queryClient.invalidateQueries({ queryKey: queryKeys.interfaces.detail(result.id) });
      return result;
    },
    [createInterface, invalidateDesignWorkQueries, queryClient]
  );

  const handleUpdateInterface = useCallback(
    async (id: string, updates: Partial<Interface>) => {
      await updateInterface(id, updates);
      queryClient.invalidateQueries({ queryKey: queryKeys.interfaces.detail(id) });
    },
    [updateInterface, queryClient]
  );

  const handleDeleteInterface = useCallback(
    async (id: string) => {
      await deleteInterface(id);
      invalidateDesignWorkQueries();
      queryClient.invalidateQueries({ queryKey: queryKeys.interfaces.detail(id) });
    },
    [deleteInterface, invalidateDesignWorkQueries, queryClient]
  );

  // Document handlers
  const handleCreateDocument = useCallback(
    async (data: CreateDocumentDto) => {
      const result = await createDocument(data);
      invalidateDesignWorkQueries();
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(result.id) });
      return result;
    },
    [createDocument, invalidateDesignWorkQueries, queryClient]
  );

  const handleUpdateDocument = useCallback(
    async (id: string, updates: Partial<Document>) => {
      await updateDocument(id, updates);
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(id) });
    },
    [updateDocument, queryClient]
  );

  const handleDeleteDocument = useCallback(
    async (id: string) => {
      await deleteDocument(id);
      invalidateDesignWorkQueries();
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(id) });
    },
    [deleteDocument, invalidateDesignWorkQueries, queryClient]
  );

  return {
    // DesignWork
    createDesignWork: handleCreateDesignWork,
    updateDesignWork: handleUpdateDesignWork,
    deleteDesignWork: handleDeleteDesignWork,

    // Diagram
    createDiagram: handleCreateDiagram,
    updateDiagram: handleUpdateDiagram,
    deleteDiagram: handleDeleteDiagram,

    // Interface
    createInterface: handleCreateInterface,
    updateInterface: handleUpdateInterface,
    deleteInterface: handleDeleteInterface,

    // Document
    createDocument: handleCreateDocument,
    updateDocument: handleUpdateDocument,
    deleteDocument: handleDeleteDocument,
  };
}
