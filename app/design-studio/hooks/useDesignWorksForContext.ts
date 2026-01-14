/**
 * useDesignWorksForContext Hook
 * Abstracts data fetching for design works based on context.
 * - When useCaseId is provided: fetches only designworks linked to that use case
 * - When useCaseId is undefined: fetches all designworks for the solution
 */

import { useEffect, useMemo } from 'react';
import { useDesignWorkStore } from '~/core/entities/design-studio/store/design-work/useDesignWorkStore';
import { useReferenceStore } from '~/core/entities/design-studio/store/reference/useReferenceStore';
import {
  useDesignWorksWithContentQuery,
  useDesignWorksWithContentByUseCaseQuery,
} from '../queries';

interface UseDesignWorksForContextProps {
  solutionId: string;
  useCaseId?: string;
}

export function useDesignWorksForContext({ solutionId, useCaseId }: UseDesignWorksForContextProps) {
  const setDesignWorks = useDesignWorkStore((state) => state.setDesignWorks);
  const storedDesignWorks = useDesignWorkStore((state) => state.designWorks);
  const error = useDesignWorkStore((state) => state.error);
  const setReferences = useReferenceStore((state) => state.setReferences);

  // Choose query based on context - only one will be enabled at a time
  const {
    data: solutionData,
    isLoading: loadingSolution,
  } = useDesignWorksWithContentQuery(useCaseId ? undefined : solutionId);

  const {
    data: useCaseData,
    isLoading: loadingUseCase,
  } = useDesignWorksWithContentByUseCaseQuery(
    useCaseId ? solutionId : undefined,
    useCaseId
  );

  const data = useCaseId ? useCaseData : solutionData;
  const isLoading = useCaseId ? loadingUseCase : loadingSolution;

  // Sync to Zustand stores when data changes
  useEffect(() => {
    if (data) {
      setDesignWorks(data.designWorks);
      setReferences(data.references);
    }
  }, [data, setDesignWorks, setReferences]);

  const filteredDesignWorks = useMemo(
    () => (storedDesignWorks.length > 0 ? storedDesignWorks : data?.designWorks ?? []),
    [storedDesignWorks, data?.designWorks]
  );

  return { designWorks: filteredDesignWorks, loading: isLoading, error };
}
