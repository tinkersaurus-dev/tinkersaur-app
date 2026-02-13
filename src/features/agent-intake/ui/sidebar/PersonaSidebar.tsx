import { useAgentIntakeStore, useExtractionsByType } from '../../model/useAgentIntakeStore';
import { usePersonaSimilarityCheck } from '../../lib/usePersonaSimilarityCheck';
import { PersonaSidebarCard } from './PersonaSidebarCard';

export function PersonaSidebar() {
  // Activate similarity checking - runs automatically when personas are extracted
  usePersonaSimilarityCheck();

  const personaExtractions = useExtractionsByType('personas');
  const personaMatches = useAgentIntakeStore((state) => state.personaMatches);
  const checkingPersonas = useAgentIntakeStore((state) => state.checkingPersonas);
  const pendingMerges = useAgentIntakeStore((state) => state.pendingPersonaMerges);

  return (
    <div className="w-[480px] flex-shrink-0 bg-[var(--bg-light)] overflow-y-auto">
      <div className="p-4">
        {personaExtractions.length > 0 && (
          <div className="space-y-4">
            {personaExtractions.map((extraction) => (
              <PersonaSidebarCard
                key={extraction.id}
                extraction={extraction}
                matches={personaMatches.get(extraction.id)}
                isChecking={checkingPersonas.has(extraction.id)}
                pendingMerge={pendingMerges.get(extraction.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
