import { useState, useEffect } from 'react';
import type { ExtractedFeedback } from '~/core/entities/discovery';
import { feedbackApi } from '~/core/entities/discovery/api';
import type { SimilarFeedbackInfo } from '~/discovery/types';

export function useSimilarityCheckForFeedback(
  feedbackItems: ExtractedFeedback[] | null,
  teamId: string | undefined
) {
  const [similarFeedback, setSimilarFeedback] = useState<SimilarFeedbackInfo[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!feedbackItems || !teamId || feedbackItems.length === 0) {
      setSimilarFeedback([]);
      return;
    }

    const checkSimilarity = async () => {
      setIsChecking(true);
      try {
        const results = await Promise.all(
          feedbackItems.map(async (feedback, index) => {
            const similarResults = await feedbackApi.findSimilar({
              teamId,
              content: feedback.content,
              threshold: 0.5,
              limit: 5,
            });

            if (similarResults.length > 0) {
              return {
                feedbackIndex: index,
                feedbackContent: feedback.content,
                similarResults,
              };
            }
            return null;
          })
        );

        setSimilarFeedback(results.filter(Boolean) as SimilarFeedbackInfo[]);
      } finally {
        setIsChecking(false);
      }
    };

    checkSimilarity();
  }, [feedbackItems, teamId]);

  return { similarFeedback, isChecking };
}
