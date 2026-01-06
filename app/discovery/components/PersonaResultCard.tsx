import { useState, memo } from 'react';
import { FiUser, FiTarget, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { Card } from '~/core/components/ui/Card';
import type { ExtractedPersona } from '~/core/entities/discovery';
import type { SimilarPersonaResult } from '~/core/entities/product-management/types';
import { formatRelativeTime } from '~/core/utils/formatRelativeTime';
import { QuotesList } from './QuoteHighlight';
import { SimilarityComparisonDrawer } from './SimilarityComparisonDrawer';

interface PersonaResultCardProps {
  persona: ExtractedPersona;
  index: number;
  onDelete?: (index: number) => void;
  similarPersonas?: SimilarPersonaResult[];
  isCheckingSimilarity?: boolean;
}

export const PersonaResultCard = memo(function PersonaResultCard({ persona, index, onDelete, similarPersonas, isCheckingSimilarity }: PersonaResultCardProps) {
  const [selectedMatch, setSelectedMatch] = useState<SimilarPersonaResult | null>(null);

  const hasGoals = persona.goals.length > 0;
  const hasPainPoints = persona.painPoints.length > 0;

  return (
    <>
      <Card className="h-full flex flex-col">
        {/* Similarity Notices */}
        {isCheckingSimilarity && (
          <div className="mb-2 px-3 py-1.5 bg-[var(--bg-secondary)] rounded text-xs text-[var(--text-muted)]">
            Checking for similar personas...
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <FiUser className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-[var(--text)]">{persona.name}</h3>
            <p className="text-sm text-[var(--text-muted)]">{persona.role}</p>
          </div>
        </div>

        {/* 2x2 Content Grid */}
        <div className="mt-4 grid grid-cols-2 gap-4 flex-1">
          {/* Row 1: Description and Quotes */}
          <div>
            <h4 className="text-sm font-medium text-[var(--text)] mb-2">Description</h4>
            <p className="text-sm text-[var(--text-muted)]">{persona.description}</p>
          </div>
          <div>
            {persona.quotes.length > 0 && (
              <QuotesList quotes={persona.quotes} maxVisible={2} />
            )}
          </div>

          {/* Row 2: Goals and Pain Points */}
          <div>
            {hasGoals && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <FiTarget className="w-4 h-4 text-[var(--success)]" />
                  <h4 className="text-sm font-medium text-[var(--text)]">Goals</h4>
                </div>
                <ul className="space-y-1">
                  {persona.goals.map((goal, i) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--text-muted)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--success)] before:rounded-full"
                    >
                      {goal}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div>
            {hasPainPoints && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <FiAlertCircle className="w-4 h-4 text-[var(--danger)]" />
                  <h4 className="text-sm font-medium text-[var(--text)]">Pain Points</h4>
                </div>
                <ul className="space-y-1">
                  {persona.painPoints.map((painPoint, i) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--text-muted)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--danger)] before:rounded-full"
                    >
                      {painPoint}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Footer with similar match indicator and delete button */}
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
          {similarPersonas && similarPersonas.length > 0 ? (
            <button
              onClick={() => setSelectedMatch(similarPersonas[0])}
              className="px-3 py-1.5 bg-[var(--warning)]/10 border border-[var(--warning)] rounded-lg text-left hover:bg-[var(--warning)]/20 transition-colors flex items-center gap-1.5"
            >
              <FiAlertCircle className="w-3.5 h-3.5 text-[var(--warning)]" />
              <span className="text-xs font-medium text-[var(--text)]">
                {similarPersonas.length} similar {similarPersonas.length === 1 ? 'persona' : 'personas'}
              </span>
            </button>
          ) : (
            <div />
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(index)}
              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
              title="Remove persona"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </Card>

      {/* Similarity Details Bottom Drawer */}
      <SimilarityComparisonDrawer
        isOpen={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
        title="Similar Persona Comparison"
        selectedMatch={selectedMatch}
        getSimilarity={(m) => m.similarity}
        getMatchType={(m) => m.matchType}
        allMatches={similarPersonas ?? []}
        onSelectMatch={setSelectedMatch}
        getMatchId={(m) => m.persona.id}
        newItemLabel="New Persona (from intake)"
        existingItemLabel="Existing Persona"
        actionHint="If this is a duplicate, you can delete this persona from the intake results before saving."
        renderMatchListItem={(match) => (
          <>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-medium text-[var(--text)] line-clamp-1">
                {match.persona.name}
              </p>
            </div>
            <p className="text-xs text-[var(--text-muted)] line-clamp-1">
              {match.persona.role}
            </p>
            <p className="text-xs text-[var(--text-disabled)] mt-1">
              {formatRelativeTime(match.persona.updatedAt)}
            </p>
          </>
        )}
        renderNewItem={() => (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <FiUser className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-[var(--text)]">{persona.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">{persona.role}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-[var(--text-muted)] mb-1">Description</h4>
              <p className="text-sm text-[var(--text)]">{persona.description || 'No description provided.'}</p>
            </div>

            {hasGoals && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FiTarget className="w-4 h-4 text-[var(--success)]" />
                  <h4 className="text-xs font-medium text-[var(--text-muted)]">Goals</h4>
                </div>
                <ul className="space-y-1">
                  {persona.goals.map((goal, i) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--text)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--success)] before:rounded-full"
                    >
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasPainPoints && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FiAlertCircle className="w-4 h-4 text-[var(--danger)]" />
                  <h4 className="text-xs font-medium text-[var(--text-muted)]">Pain Points</h4>
                </div>
                <ul className="space-y-1">
                  {persona.painPoints.map((painPoint, i) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--text)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--danger)] before:rounded-full"
                    >
                      {painPoint}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        renderExistingItem={(match) => (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <FiUser className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-[var(--text)]">{match.persona.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">{match.persona.role}</p>
                <p className="text-xs text-[var(--text-disabled)] mt-1">
                  Last updated {formatRelativeTime(match.persona.updatedAt)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-[var(--text-muted)] mb-1">Description</h4>
              <p className="text-sm text-[var(--text)]">{match.persona.description || 'No description provided.'}</p>
            </div>

            {match.persona.goals && match.persona.goals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FiTarget className="w-4 h-4 text-[var(--success)]" />
                  <h4 className="text-xs font-medium text-[var(--text-muted)]">Goals</h4>
                </div>
                <ul className="space-y-1">
                  {match.persona.goals.map((goal, i) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--text)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--success)] before:rounded-full"
                    >
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {match.persona.painPoints && match.persona.painPoints.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FiAlertCircle className="w-4 h-4 text-[var(--danger)]" />
                  <h4 className="text-xs font-medium text-[var(--text-muted)]">Pain Points</h4>
                </div>
                <ul className="space-y-1">
                  {match.persona.painPoints.map((painPoint, i) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--text)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--danger)] before:rounded-full"
                    >
                      {painPoint}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      />
    </>
  );
});
