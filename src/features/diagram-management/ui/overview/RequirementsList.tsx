/**
 * RequirementsList Component
 * Container for draggable requirements in the Overview tab
 */

import { VStack, Empty } from '@/shared/ui';
import { RequirementItem } from './RequirementItem';
import type { RequirementWithUseCase } from '@/entities/requirement';

interface RequirementsListProps {
  requirements: RequirementWithUseCase[];
  isLoading: boolean;
  /** Map of requirement ID to folder names it's referenced in */
  requirementFolderMap?: Record<string, string[]>;
}

export function RequirementsList({ requirements, isLoading, requirementFolderMap = {} }: RequirementsListProps) {
  if (isLoading) {
    return (
      <div style={{ padding: '16px', color: 'var(--text-secondary)' }}>
        Loading requirements...
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <Empty description="No requirements defined for the use cases in this solution" />
    );
  }

  return (
    <VStack gap="none">
      {requirements.map((req) => (
        <RequirementItem
          key={req.id}
          requirement={req}
          folderNames={requirementFolderMap[req.id]}
        />
      ))}
    </VStack>
  );
}
