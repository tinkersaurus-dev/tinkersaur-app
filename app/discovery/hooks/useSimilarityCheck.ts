import { useState, useEffect } from 'react';
import type { ExtractedPersona } from '~/core/entities/discovery';
import { personaApi } from '~/core/entities/product-management/api';
import type { SimilarPersonaInfo } from '~/discovery/types';

export function useSimilarityCheck(
  personas: ExtractedPersona[] | null,
  teamId: string | undefined
) {
  const [similarPersonas, setSimilarPersonas] = useState<SimilarPersonaInfo[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!personas || !teamId || personas.length === 0) {
      setSimilarPersonas([]);
      return;
    }

    const checkSimilarity = async () => {
      setIsChecking(true);
      try {
        const results = await Promise.all(
          personas.map(async (persona, index) => {
            const similarResults = await personaApi.findSimilar({
              teamId,
              name: persona.name,
              description: persona.description,
              role: persona.role,
              threshold: 0.5,
              limit: 5,
            });

            if (similarResults.length > 0) {
              return {
                personaIndex: index,
                personaName: persona.name,
                similarResults,
              };
            }
            return null;
          })
        );

        setSimilarPersonas(results.filter(Boolean) as SimilarPersonaInfo[]);
      } finally {
        setIsChecking(false);
      }
    };

    checkSimilarity();
  }, [personas, teamId]);

  return { similarPersonas, isChecking };
}
