import { useState, memo, useMemo } from 'react';
import { FiTarget, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { Card } from '~/core/components/ui/Card';
import { Tag } from '~/core/components/ui/Tag';
import { Select } from '~/core/components/ui/Select';
import type { ExtractedOutcome, SimilarOutcomeResult } from '~/core/entities/discovery';
import type { Solution } from '~/core/entities/product-management/types';
import { QuotesList } from './QuoteHighlight';
import { SimilarityComparisonDrawer } from './SimilarityComparisonDrawer';
import { formatRelativeTime } from '~/core/utils/formatRelativeTime';

interface OutcomeResultCardProps {
  outcome: ExtractedOutcome;
  index: number;
  onDelete?: (index: number) => void;
  similarOutcomes?: SimilarOutcomeResult[];
  isCheckingSimilarity?: boolean;
  solutions: Solution[];
  selectedSolutionId: string | null;
  onSolutionChange: (index: number, solutionId: string | null) => void;
}

export const OutcomeResultCard = memo(function OutcomeResultCard({
  outcome,
  index,
  onDelete,
  similarOutcomes,
  isCheckingSimilarity,
  solutions,
  selectedSolutionId,
  onSolutionChange,
}: OutcomeResultCardProps) {
  const [selectedMatch, setSelectedMatch] = useState<SimilarOutcomeResult | null>(null);

  const solutionOptions = useMemo(() => [
    { value: '', label: 'No solution' },
    ...solutions.map((s) => ({ value: s.id, label: s.name })),
  ], [solutions]);

  return (
    <>
      <Card className="h-full flex flex-col">
        {/* Checking state */}
        {isCheckingSimilarity && (
          <div className="mb-3 px-4 py-2.5 bg-[var(--bg-secondary)] rounded-lg text-xs text-[var(--text-muted)]">
            Checking for similar outcomes...
          </div>
        )}

        {/* Header with icon */}
        <div className="flex items-start gap-3">
          <div className="p-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex-shrink-0">
            <FiTarget className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--text)] font-medium">
              {outcome.description}
            </p>
            <div className="mt-2">
              <Tag color="green">{outcome.target}</Tag>
            </div>
          </div>
        </div>

        {/* Quotes */}
        {outcome.quotes && outcome.quotes.length > 0 && (
          <div className="mt-4 flex-1">
            <QuotesList quotes={outcome.quotes} maxVisible={2} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
          {/* Similarity indicator */}
          {similarOutcomes && similarOutcomes.length > 0 ? (
            <button
              onClick={() => setSelectedMatch(similarOutcomes[0])}
              className="px-3 py-1.5 bg-[var(--warning)]/10 border border-[var(--warning)] rounded-lg text-left hover:bg-[var(--warning)]/20 transition-colors flex items-center gap-1.5"
            >
              <FiAlertCircle className="w-3.5 h-3.5 text-[var(--warning)]" />
              <span className="text-xs font-medium text-[var(--text)]">
                {similarOutcomes.length} similar {similarOutcomes.length === 1 ? 'outcome' : 'outcomes'}
              </span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {/* Solution selector */}
            <Select
              value={selectedSolutionId ?? ''}
              onChange={(value) => onSolutionChange(index, value || null)}
              options={solutionOptions}
              className="w-36 text-xs"
              size='small'
            />

            {/* Delete button */}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(index)}
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                title="Remove outcome"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Similarity Details Bottom Drawer */}
      <SimilarityComparisonDrawer
        isOpen={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
        title="Similar Outcome Found"
        selectedMatch={selectedMatch}
        getSimilarity={(m) => m.similarity}
        getMatchType={(m) => m.matchType}
        allMatches={similarOutcomes ?? []}
        onSelectMatch={setSelectedMatch}
        getMatchId={(m) => m.outcome.id}
        newItemLabel="New Outcome (from intake)"
        existingItemLabel="Existing Outcome"
        actionHint="If this is a duplicate, you can delete this outcome from the intake results before saving."
        renderMatchListItem={(match) => (
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-[var(--text)] line-clamp-2">
                {match.outcome.description}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {match.outcome.target}
              </p>
            </div>
          </div>
        )}
        renderNewItem={() => (
          <div className="space-y-4">
            <div>
              <span className="text-xs text-[var(--text-muted)]">Description:</span>
              <p className="text-sm font-medium text-[var(--text)] mt-1">{outcome.description}</p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Target:</span>
              <div className="mt-1">
                <Tag color="green">{outcome.target}</Tag>
              </div>
            </div>
            {outcome.quotes && outcome.quotes.length > 0 && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">Quotes:</span>
                <div className="mt-1 space-y-2">
                  {outcome.quotes.map((quote, idx) => (
                    <div key={idx} className="pl-3 border-l-2 border-[var(--border)]">
                      <p className="text-xs italic text-[var(--text-muted)]">"{quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        renderExistingItem={(match) => (
          <div className="space-y-4">
            <div>
              <span className="text-xs text-[var(--text-muted)]">Description:</span>
              <p className="text-sm font-medium text-[var(--text)] mt-1">{match.outcome.description}</p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Target:</span>
              <div className="mt-1">
                <Tag color="green">{match.outcome.target}</Tag>
              </div>
            </div>
            {match.outcome.solutionId && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">Solution:</span>
                <p className="text-sm text-[var(--text)] mt-1">Linked to solution</p>
              </div>
            )}
            <div>
              <span className="text-xs text-[var(--text-muted)]">Last updated:</span>
              <p className="text-sm text-[var(--text)] mt-1">
                {formatRelativeTime(match.outcome.updatedAt)}
              </p>
            </div>
          </div>
        )}
      />
    </>
  );
});
