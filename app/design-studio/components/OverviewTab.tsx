/**
 * OverviewTab Component
 * Displays requirements for use cases in the current design studio context
 * Requirements can be dragged to folders in the sidebar to create references
 */

import { useMemo } from 'react';
import { Card } from '~/core/components/ui';
import { useUseCasesQuery } from '~/product-management/queries';
import { useRequirementsBySolutionQuery } from '~/product-management/queries/useRequirementsBySolutionQuery';
import { useDesignWorkStore } from '~/core/entities/design-studio/store/design-work/useDesignWorkStore';
import { RequirementsList } from './RequirementsList';

interface OverviewTabProps {
  solutionId: string;
  useCaseId?: string;
}

export function OverviewTab({ solutionId, useCaseId }: OverviewTabProps) {
  // Fetch all use cases for the solution
  const { data: allUseCases = [], isLoading: isLoadingUseCases } = useUseCasesQuery(solutionId);
  const designWorks = useDesignWorkStore((state) => state.designWorks);

  // Filter use cases based on context (single use case or all)
  const relevantUseCases = useCaseId
    ? allUseCases.filter((uc) => uc.id === useCaseId)
    : allUseCases;

  // Fetch requirements for the relevant use cases
  const { data: requirements, isLoading: isLoadingRequirements } = useRequirementsBySolutionQuery(
    relevantUseCases,
    relevantUseCases.length > 0
  );

  // Build a map of requirement ID -> folder names that reference it
  const requirementFolderMap = useMemo(() => {
    const map: Record<string, string[]> = {};

    for (const dw of designWorks) {
      if (!dw.requirementRefs || dw.requirementRefs.length === 0) continue;

      for (const ref of dw.requirementRefs) {
        if (!map[ref.requirementId]) {
          map[ref.requirementId] = [];
        }
        map[ref.requirementId].push(dw.name);
      }
    }

    return map;
  }, [designWorks]);

  const isLoading = isLoadingUseCases || isLoadingRequirements;

  return (
    <div className="bg-[var(--bg)]" style={{ padding: '24px' }}>
      <Card>
        <h3 style={{ marginBottom: '16px' }}>Requirements</h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Drag requirements to folders in the sidebar to include them in the compiled context.
        </p>
        <RequirementsList
          requirements={requirements}
          isLoading={isLoading}
          requirementFolderMap={requirementFolderMap}
        />
      </Card>
    </div>
  );
}
