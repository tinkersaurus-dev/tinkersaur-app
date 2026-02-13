import { useAgentIntakeStore } from '../../model/useAgentIntakeStore';
import { ExtractionCard } from '../cards/ExtractionCard';
import type { Extraction } from '../../model/types';

interface InlineCardGroupProps {
  extractionIds: string[];
  extractions: Map<string, Extraction>;
}

/**
 * Renders one or more extraction cards inline after a paragraph.
 */
export function InlineCardGroup({ extractionIds, extractions }: InlineCardGroupProps) {
  const activeExtractionId = useAgentIntakeStore((state) => state.activeExtractionId);
  const newExtractionIds = useAgentIntakeStore((state) => state.newExtractionIds);
  const setActiveExtraction = useAgentIntakeStore((state) => state.setActiveExtraction);
  const acceptExtraction = useAgentIntakeStore((state) => state.acceptExtraction);
  const rejectExtraction = useAgentIntakeStore((state) => state.rejectExtraction);
  const clearNewExtractionFlag = useAgentIntakeStore((state) => state.clearNewExtractionFlag);

  return (
    <div className="inline-card-group my-4 ml-200 space-y-2">
      {extractionIds.map((id) => {
        const extraction = extractions.get(id);
        if (!extraction) return null;

        return (
          <ExtractionCard
            key={id}
            extraction={extraction}
            isActive={id === activeExtractionId}
            isNew={newExtractionIds.has(id)}
            onClick={() => setActiveExtraction(id)}
            onAccept={() => acceptExtraction(id)}
            onReject={() => rejectExtraction(id)}
            onAnimationComplete={() => clearNewExtractionFlag(id)}
          />
        );
      })}
    </div>
  );
}
