import { useIntakeStore, useExtractionsByType } from '../../model/useIntakeStore';
import { usePersonaSimilarityCheck } from '../../lib/usePersonaSimilarityCheck';
import { PersonaSidebarCard } from './PersonaSidebarCard';
import { IntakeSourcePanel } from './IntakeSourcePanel';

export function PersonaSidebar() {
  // Activate similarity checking - runs automatically when personas are extracted
  usePersonaSimilarityCheck();

  const documentType = useIntakeStore((state) => state.documentType);
  const personaExtractions = useExtractionsByType('personas');
  const personaMatches = useIntakeStore((state) => state.personaMatches);
  const checkingPersonas = useIntakeStore((state) => state.checkingPersonas);
  const pendingMerges = useIntakeStore((state) => state.pendingPersonaMerges);

  return (
    <div className="w-[480px] flex-shrink-0 bg-[var(--bg-light)] overflow-y-auto">
      <div className="p-4">
        {documentType && (
          <>
            <IntakeSourcePanel />
            {personaExtractions.length > 0 && (
              <div className="my-4 border-t border-[var(--border)]" />
            )}
          </>
        )}
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
