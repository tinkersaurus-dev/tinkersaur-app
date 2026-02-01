/**
 * useSidebarState Hook
 * Consolidates all store interactions for the StudioSidebar component.
 * Follows the pattern established by useCanvasState.
 */

import { useCallback } from 'react';
import { useDesignStudioUIStore } from '@/app/model/stores/design-studio-ui';
import { useDesignWorkStore } from '@/entities/design-work';
import { useReferenceStore } from '@/entities/reference';
import { useDesignStudioCRUD, useFolderReferenceDrop, useRequirementReferenceDrop } from '@/features/diagram-management';
import { useSolutionQuery } from '~/product-management/queries';
import type { UseSidebarStateReturn, ReorderUpdate } from '../../model/types';
import type { DiagramType } from '@/entities/diagram';

interface UseSidebarStateProps {
  solutionId: string;
  useCaseId?: string;
}

export function useSidebarState({ solutionId }: UseSidebarStateProps): UseSidebarStateReturn {
  // Tab management from UI store
  const { openTab } = useDesignStudioUIStore();

  // Get solution data from TanStack Query (for teamId)
  const { data: solution } = useSolutionQuery(solutionId);

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
  const { canDropRequirementOnFolder, handleRequirementFolderDrop } = useRequirementReferenceDrop(solutionId);

  // Combined folder drop handlers
  const combinedCanDropOnFolder = useCallback(
    (dragData: Record<string, unknown>): boolean => {
      return canDropOnFolder(dragData) || canDropRequirementOnFolder(dragData);
    },
    [canDropOnFolder, canDropRequirementOnFolder]
  );

  const combinedHandleFolderDrop = useCallback(
    async (folderId: string, dragData: Record<string, unknown>) => {
      if (canDropRequirementOnFolder(dragData)) {
        await handleRequirementFolderDrop(folderId, dragData);
      } else {
        await handleFolderDrop(folderId, dragData);
      }
    },
    [canDropRequirementOnFolder, handleRequirementFolderDrop, handleFolderDrop]
  );

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
      canDropOnFolder: combinedCanDropOnFolder,
      handleFolderDrop: combinedHandleFolderDrop,
    },
    openTab,
  };
}
