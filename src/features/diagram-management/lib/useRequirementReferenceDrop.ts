import { useCallback } from 'react';
import { useDesignWorkStore } from '@/entities/design-work';

/**
 * Hook for handling requirement drops onto folders
 * Creates a RequirementRef on the folder (live reference to the requirement)
 */
export function useRequirementReferenceDrop(solutionId: string | undefined) {
  const addRequirementRef = useDesignWorkStore((state) => state.addRequirementRef);

  /**
   * Check if drag data represents a requirement
   */
  const canDropRequirementOnFolder = useCallback(
    (dragData: Record<string, unknown>): boolean => {
      return dragData.type === 'requirement' && !!dragData.requirementId;
    },
    []
  );

  /**
   * Handle requirement drop onto a folder node
   */
  const handleRequirementFolderDrop = useCallback(
    async (folderId: string, dragData: Record<string, unknown>) => {
      if (!solutionId) {
        console.error('Solution ID is required for requirement drop');
        return;
      }

      if (dragData.type !== 'requirement') return;

      const requirementId = dragData.requirementId as string;
      if (!requirementId) {
        console.error('Requirement ID is required');
        return;
      }

      try {
        await addRequirementRef(folderId, requirementId);
      } catch (error) {
        console.error('Failed to add requirement reference:', error);
        throw error;
      }
    },
    [solutionId, addRequirementRef]
  );

  return {
    canDropRequirementOnFolder,
    handleRequirementFolderDrop,
  };
}
