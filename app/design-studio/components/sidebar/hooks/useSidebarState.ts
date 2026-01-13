/**
 * useSidebarState Hook
 * Consolidates all store interactions for the StudioSidebar component.
 * Follows the pattern established by useCanvasState.
 */

import { useCallback } from 'react';
import { useDesignStudioUIStore } from '../../../store';
import { useDesignWorkStore } from '~/core/entities/design-studio/store/design-work/useDesignWorkStore';
import { useReferenceStore } from '~/core/entities/design-studio/store/reference/useReferenceStore';
import { useDesignStudioCRUD } from '../../../hooks/useDesignStudioCRUD';
import { useFolderReferenceDrop } from '../../../hooks/useFolderReferenceDrop';
import { useSolutionQuery } from '~/product-management/queries';
import type { UseSidebarStateReturn, ReorderUpdate } from '../types';
import type { DiagramType } from '~/core/entities/design-studio';

interface UseSidebarStateProps {
  solutionId: string;
  useCaseId?: string;
}

export function useSidebarState({ solutionId }: UseSidebarStateProps): UseSidebarStateReturn {
  // Tab management from UI store
  const { openTab } = useDesignStudioUIStore();

  // Get solution name from TanStack Query
  const { data: solution } = useSolutionQuery(solutionId);
  const solutionName = solution?.name;

  // Entity data from Zustand stores
  const designWorks = useDesignWorkStore((state) => state.designWorks);
  const references = useReferenceStore((state) => state.references);

  // Get reorderItems action from store
  const storeReorderItems = useDesignWorkStore((state) => state.reorderItems);

  // CRUD operations from hook
  const {
    createDiagram,
    createInterface,
    createDocument,
    deleteDiagram,
    deleteInterface,
    deleteDocument,
    deleteDesignWork,
    createDesignWork,
    updateDesignWork,
  } = useDesignStudioCRUD();

  // Folder reference drop handlers
  const { canDropOnFolder, handleFolderDrop } = useFolderReferenceDrop(solutionId);

  // Wrap createDiagram to match expected signature
  const wrappedCreateDiagram = useCallback(
    async (data: { designWorkId: string; name: string; type: DiagramType }) => {
      await createDiagram(data);
    },
    [createDiagram]
  );

  // Wrap reorderItems to match expected signature
  const wrappedReorderItems = useCallback(
    async (updates: ReorderUpdate[]) => {
      await storeReorderItems(updates);
    },
    [storeReorderItems]
  );

  return {
    solutionName,
    teamId: solution?.teamId,
    designWorks,
    references,
    crudOperations: {
      createDiagram: wrappedCreateDiagram,
      createInterface,
      createDocument,
      deleteDiagram,
      deleteInterface,
      deleteDocument,
      deleteDesignWork,
      createDesignWork,
      updateDesignWork,
      reorderItems: wrappedReorderItems,
    },
    folderDropHandlers: {
      canDropOnFolder,
      handleFolderDrop,
    },
    openTab,
  };
}
