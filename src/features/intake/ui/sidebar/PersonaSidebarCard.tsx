import { useState } from 'react';
import { FiUser, FiTarget, FiAlertCircle, FiCheck, FiX, FiGitMerge } from 'react-icons/fi';
import { useIntakeStore } from '../../model/useIntakeStore';
import type { Extraction, PersonaEntity, PersonaPendingMerge } from '../../model/types';
import type { SimilarPersonaResult } from '@/entities/persona';
import type { PendingMerge } from '../../model/types';
import { IntakePersonaMergeModal } from '@/features/entity-merging';
import { PersonaMatchCard } from './PersonaMatchCard';

interface PersonaSidebarCardProps {
  extraction: Extraction;
  matches?: SimilarPersonaResult[];
  isChecking: boolean;
  pendingMerge?: PersonaPendingMerge;
}

export function PersonaSidebarCard({
  extraction,
  matches,
  isChecking,
  pendingMerge,
}: PersonaSidebarCardProps) {
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const acceptExtraction = useIntakeStore((state) => state.acceptExtraction);
  const rejectExtraction = useIntakeStore((state) => state.rejectExtraction);
  const addPendingPersonaMerge = useIntakeStore((state) => state.addPendingPersonaMerge);
  const clearPersonaMatches = useIntakeStore((state) => state.clearPersonaMatches);

  const entity = extraction.entity as PersonaEntity;
  const isMerged = !!pendingMerge;
  const hasMatches = matches && matches.length > 0 && !isMerged;

  const handleMergeClick = (matchPersonaId: string) => {
    setSelectedMatchId(matchPersonaId);
    setMergeModalOpen(true);
  };

  const handleMergeConfirmed = (merge: PendingMerge) => {
    addPendingPersonaMerge(extraction.id, {
      extractionId: extraction.id,
      targetPersonaId: merge.targetPersonaId,
      mergedPersona: merge.mergedPersona,
      quotes: entity.quotes,
    });
    clearPersonaMatches(extraction.id);
    setMergeModalOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Extracted Persona Card - Blue styling */}
      <div
        className={`border-1 border-l-6 border-[var(--tag-blue)] p-3 ${
          isMerged ? 'opacity-70' : ''
        }`}
      >
        {/* Merge indicator */}
        {isMerged && (
          <div className="mb-2 px-2 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-xs flex items-center gap-1.5">
            <FiGitMerge className="w-3 h-3 text-[var(--primary)]" />
            <span className="text-[var(--primary)]">Will merge on save</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <FiUser className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-[var(--text)] text-base">{entity.name}</h4>
            <p className="text-sm text-[var(--text-muted)]">{entity.role}</p>
          </div>
        </div>

        {/* Description */}
        {entity.description && (
          <p className="text-sm text-[var(--text-muted)] mb-3 line-clamp-3">
            {entity.description}
          </p>
        )}

        {/* Goals */}
        {entity.goals && entity.goals.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-1">
              <FiTarget className="w-4 h-4 text-[var(--success)]" />
              <span className="text-sm font-medium text-[var(--text)]">Goals</span>
            </div>
            <ul className="text-sm text-[var(--text-muted)] pl-5 space-y-0.5">
              {entity.goals.slice(0, 3).map((goal, i) => (
                <li key={i} className="truncate">
                  - {goal}
                </li>
              ))}
              {entity.goals.length > 3 && (
                <li className="text-[var(--text-disabled)]">
                  +{entity.goals.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Pain Points */}
        {entity.painPoints && entity.painPoints.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-1">
              <FiAlertCircle className="w-4 h-4 text-[var(--danger)]" />
              <span className="text-sm font-medium text-[var(--text)]">Pain Points</span>
            </div>
            <ul className="text-sm text-[var(--text-muted)] pl-5 space-y-0.5">
              {entity.painPoints.slice(0, 3).map((point, i) => (
                <li key={i} className="truncate">
                  - {point}
                </li>
              ))}
              {entity.painPoints.length > 3 && (
                <li className="text-[var(--text-disabled)]">
                  +{entity.painPoints.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Status indicator */}
        {isChecking && (
          <div className="text-xs text-[var(--text-muted)] italic mb-2">
            Checking for matches...
          </div>
        )}

        {/* Accept/Reject buttons */}
        {extraction.status === 'pending' && !isMerged && (
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]/50">
            <button
              onClick={() => rejectExtraction(extraction.id)}
              className="p-1.5 hover:bg-[var(--danger)]/10 text-[var(--danger)] transition-colors"
              title="Reject"
            >
              <FiX className="w-4 h-4" />
            </button>
            <button
              onClick={() => acceptExtraction(extraction.id)}
              className="p-1.5 hover:bg-[var(--success)]/10 text-[var(--success)] transition-colors"
              title="Accept"
            >
              <FiCheck className="w-4 h-4" />
            </button>
          </div>
        )}

        {extraction.status === 'accepted' && !isMerged && (
          <div className="flex justify-end pt-2 border-t border-[var(--border)]/50">
            <span className="text-xs text-[var(--success)] flex items-center gap-1">
              <FiCheck className="w-3 h-3" />
              Accepted
            </span>
          </div>
        )}
      </div>

      {/* Match Cards - White styling, smaller text */}
      {hasMatches && (
        <div className="pl-4 space-y-1.5">
          <div className="text-xs text-[var(--text-muted)] font-medium">
            Potential Matches:
          </div>
          {matches.map((match) => (
            <PersonaMatchCard
              key={match.persona.id}
              match={match}
              onMerge={() => handleMergeClick(match.persona.id)}
            />
          ))}
        </div>
      )}

      {/* Merge Modal */}
      {mergeModalOpen && selectedMatchId && (
        <IntakePersonaMergeModal
          open={true}
          onClose={() => setMergeModalOpen(false)}
          intakePersona={{
            name: entity.name,
            description: entity.description,
            role: entity.role,
            goals: entity.goals ?? [],
            painPoints: entity.painPoints ?? [],
            demographics: {},
            quotes: entity.quotes ?? [],
          }}
          intakePersonaIndex={0}
          existingPersonaId={selectedMatchId}
          onMergeConfirmed={handleMergeConfirmed}
        />
      )}
    </div>
  );
}
