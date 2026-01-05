import { useState, useEffect } from 'react';
import type { ExtractedUseCase } from '~/core/entities/discovery';
import { useCaseApi } from '~/core/entities/product-management/api';
import type { SimilarUseCaseInfo } from '~/discovery/types';

export function useSimilarityCheckForUseCases(
  useCases: ExtractedUseCase[] | null,
  teamId: string | undefined
) {
  const [similarUseCases, setSimilarUseCases] = useState<SimilarUseCaseInfo[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!useCases || !teamId || useCases.length === 0) {
      setSimilarUseCases([]);
      return;
    }

    const checkSimilarity = async () => {
      setIsChecking(true);
      try {
        const results = await Promise.all(
          useCases.map(async (useCase, index) => {
            const similarResults = await useCaseApi.findSimilar({
              teamId,
              name: useCase.name,
              description: useCase.description,
              threshold: 0.5,
              limit: 5,
            });

            if (similarResults.length > 0) {
              return {
                useCaseIndex: index,
                useCaseName: useCase.name,
                similarResults,
              };
            }
            return null;
          })
        );

        setSimilarUseCases(results.filter(Boolean) as SimilarUseCaseInfo[]);
      } finally {
        setIsChecking(false);
      }
    };

    checkSimilarity();
  }, [useCases, teamId]);

  return { similarUseCases, isChecking };
}
