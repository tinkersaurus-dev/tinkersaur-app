/**
 * Hook for fetching delivered specifications for a solution
 * Returns the latest Delivered version for each use case in the solution
 */

import { useEffect, useMemo } from 'react';
import { useUseCasesBySolutionQuery } from '@/entities/use-case';
import { useUseCaseVersionStore, UseCaseVersionStatus } from '@/entities/use-case-version';
import type { UseCase } from '@/entities/use-case';
import type { UseCaseVersion } from '@/entities/use-case-version';

export interface DeliveredSpecification {
  useCase: UseCase;
  latestDeliveredVersion: UseCaseVersion;
}

export function useDeliveredSpecifications(solutionId: string | undefined) {
  const { data: useCases = [], isLoading: useCasesLoading } = useUseCasesBySolutionQuery(solutionId);

  const { versions, fetchVersions } = useUseCaseVersionStore();

  // Fetch versions for all use cases
  useEffect(() => {
    if (useCases.length > 0) {
      useCases.forEach((uc) => {
        // Only fetch if not already cached
        if (!versions[uc.id]) {
          fetchVersions(uc.id).catch((error) => {
            console.error(`Failed to fetch versions for use case ${uc.id}:`, error);
          });
        }
      });
    }
  }, [useCases, versions, fetchVersions]);

  // Compute delivered specifications
  const specifications = useMemo((): DeliveredSpecification[] => {
    return useCases
      .map((useCase) => {
        const useCaseVersions = versions[useCase.id] || [];
        const deliveredVersions = useCaseVersions.filter(
          (v) => v.status === UseCaseVersionStatus.Delivered
        );

        if (deliveredVersions.length === 0) return null;

        // Get latest by versionNumber
        const latestDeliveredVersion = deliveredVersions.reduce((latest, current) =>
          current.versionNumber > latest.versionNumber ? current : latest
        );

        return { useCase, latestDeliveredVersion };
      })
      .filter((spec): spec is DeliveredSpecification => spec !== null);
  }, [useCases, versions]);

  // Determine if all versions are loaded
  const allVersionsLoaded = useCases.length === 0 || useCases.every((uc) => versions[uc.id] !== undefined);

  return {
    specifications,
    useCases,
    isLoading: useCasesLoading || (useCases.length > 0 && !allVersionsLoaded),
    isEmpty: allVersionsLoaded && specifications.length === 0,
    hasUseCases: useCases.length > 0,
  };
}
