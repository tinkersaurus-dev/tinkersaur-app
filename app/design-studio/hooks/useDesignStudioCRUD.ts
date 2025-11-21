import { useCallback } from 'react';
import {
  useDesignWorkStore,
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

/**
 * Hook providing CRUD operations for all design studio entities
 * Combines entity store operations in a convenient interface
 */
export function useDesignStudioCRUD() {
  // DesignWork operations
  const createDesignWork = useDesignWorkStore((state) => state.createDesignWork);
  const updateDesignWork = useDesignWorkStore((state) => state.updateDesignWork);
  const deleteDesignWork = useDesignWorkStore((state) => state.deleteDesignWork);

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
      return await createDesignWork(data);
    },
    [createDesignWork]
  );

  const handleUpdateDesignWork = useCallback(
    async (id: string, updates: Partial<DesignWork>) => {
      await updateDesignWork(id, updates);
    },
    [updateDesignWork]
  );

  const handleDeleteDesignWork = useCallback(
    async (id: string) => {
      await deleteDesignWork(id);
    },
    [deleteDesignWork]
  );

  // Diagram handlers
  const handleCreateDiagram = useCallback(
    async (data: CreateDiagramDto) => {
      return await createDiagram(data);
    },
    [createDiagram]
  );

  const handleUpdateDiagram = useCallback(
    async (id: string, updates: Partial<Diagram>) => {
      await updateDiagram(id, updates);
    },
    [updateDiagram]
  );

  const handleDeleteDiagram = useCallback(
    async (id: string) => {
      await deleteDiagram(id);
    },
    [deleteDiagram]
  );

  // Interface handlers
  const handleCreateInterface = useCallback(
    async (data: CreateInterfaceDto) => {
      return await createInterface(data);
    },
    [createInterface]
  );

  const handleUpdateInterface = useCallback(
    async (id: string, updates: Partial<Interface>) => {
      await updateInterface(id, updates);
    },
    [updateInterface]
  );

  const handleDeleteInterface = useCallback(
    async (id: string) => {
      await deleteInterface(id);
    },
    [deleteInterface]
  );

  // Document handlers
  const handleCreateDocument = useCallback(
    async (data: CreateDocumentDto) => {
      return await createDocument(data);
    },
    [createDocument]
  );

  const handleUpdateDocument = useCallback(
    async (id: string, updates: Partial<Document>) => {
      await updateDocument(id, updates);
    },
    [updateDocument]
  );

  const handleDeleteDocument = useCallback(
    async (id: string) => {
      await deleteDocument(id);
    },
    [deleteDocument]
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
