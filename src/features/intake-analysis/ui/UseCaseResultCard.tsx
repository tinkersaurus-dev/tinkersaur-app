import { useState, memo, useMemo } from 'react';
import { FiClipboard, FiTrash2, FiAlertCircle, FiGitMerge } from 'react-icons/fi';
import { Card, Button } from '@/shared/ui';
import { Select } from '@/shared/ui/Select';
import type { ExtractedUseCase } from '@/entities/intake-result';
import type { SimilarUseCaseResult } from '@/entities/use-case';
import type { Solution } from '@/entities/solution';
import { QuotesList } from './QuoteHighlight';
import { SimilarityComparisonDrawer } from './SimilarityComparisonDrawer';
import { formatRelativeTime } from '@/shared/lib/utils';
import type { PendingUseCaseMerge } from '../lib/hooks/useSaveIntakeResult';

interface UseCaseResultCardProps {
  useCase: ExtractedUseCase;
  index: number;
  onDelete?: (index: number) => void;
  similarUseCases?: SimilarUseCaseResult[];
  isCheckingSimilarity?: boolean;
  solutions: Solution[];
  selectedSolutionId: string | null;
  onSolutionChange: (index: number, solutionId: string | null) => void;
  onMerge?: (intakeUseCaseIndex: number, existingUseCaseIds: string[]) => void;
  pendingMerge?: PendingUseCaseMerge;
}

export const UseCaseResultCard = memo(function UseCaseResultCard({
  useCase,
  index,
  onDelete,
  similarUseCases,
  isCheckingSimilarity,
  solutions,
  selectedSolutionId,
  onSolutionChange,
  onMerge,
  pendingMerge,
}: UseCaseResultCardProps) {
  const [selectedMatch, setSelectedMatch] = useState<SimilarUseCaseResult | null>(null);
  const isMerging = !!pendingMerge;

  const solutionOptions = useMemo(() => [
    { value: '', label: 'No solution' },
    ...solutions.map((s) => ({ value: s.id, label: s.name })),
  ], [solutions]);

  return (
    <>
      <Card className={`h-full flex flex-col ${isMerging ? 'border-[var(--primary)] bg-[var(--primary)]/5' : ''}`}>
        {/* Pending merge indicator */}
        {isMerging && (
          <div className="mb-3 px-3 py-2 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg flex items-center gap-2">
            <FiGitMerge className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-sm text-[var(--primary)] font-medium">
              Will be merged with existing use case
            </span>
          </div>
        )}

        {/* Checking state */}
        {!isMerging && isCheckingSimilarity && (
          <div className="mb-3 px-4 py-2.5 bg-[var(--bg-secondary)] rounded-lg text-xs text-[var(--text-muted)]">
            Checking for similar use cases...
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0">
            <FiClipboard className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-[var(--text)]">{useCase.name}</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--text)] mt-4">{useCase.description}</p>

        {/* Quotes */}
        {useCase.quotes.length > 0 && (
          <div className="mt-4 flex-1">
            <QuotesList quotes={useCase.quotes} maxVisible={2} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
          {/* Similarity indicator - hide when merging */}
          {!isMerging && similarUseCases && similarUseCases.length > 0 ? (
            <button
              onClick={() => setSelectedMatch(similarUseCases[0])}
              className="px-3 py-1.5 bg-[var(--warning)]/10 border border-[var(--warning)] rounded-lg text-left hover:bg-[var(--warning)]/20 transition-colors flex items-center gap-1.5"
            >
              <FiAlertCircle className="w-3.5 h-3.5 text-[var(--warning)]" />
              <span className="text-xs font-medium text-[var(--text)]">
                {similarUseCases.length} similar {similarUseCases.length === 1 ? 'use case' : 'use cases'}
              </span>
            </button>
          ) : (
            <div />
          )}

          {/* Hide controls when merging */}
          {!isMerging && (
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
                  title="Remove use case"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Similarity Details Bottom Drawer */}
      <SimilarityComparisonDrawer
        isOpen={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
        title="Similar Use Case Found"
        selectedMatch={selectedMatch}
        getSimilarity={(m) => m.similarity}
        getMatchType={(m) => m.matchType}
        allMatches={similarUseCases ?? []}
        onSelectMatch={setSelectedMatch}
        getMatchId={(m) => m.useCase.id}
        newItemLabel="New Use Case (from intake)"
        existingItemLabel="Existing Use Case"
        actionHint={
          <div className="space-y-2">
            <p>If this is a duplicate, you can delete this use case from the intake results before saving.</p>
            {onMerge && selectedMatch && (
              <Button
                size="small"
                variant="primary"
                icon={<FiGitMerge />}
                onClick={() => {
                  onMerge(index, [selectedMatch.useCase.id]);
                  setSelectedMatch(null);
                }}
              >
                Merge with Existing
              </Button>
            )}
          </div>
        }
        renderMatchListItem={(match) => (
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-[var(--text)] line-clamp-2">
              {match.useCase.name}
            </p>
          </div>
        )}
        renderNewItem={() => (
          <div className="space-y-4">
            <div>
              <span className="text-xs text-[var(--text-muted)]">Name:</span>
              <p className="text-sm font-medium text-[var(--text)] mt-1">{useCase.name}</p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Description:</span>
              <p className="text-sm text-[var(--text)] mt-1">{useCase.description || 'None'}</p>
            </div>
            {useCase.quotes && useCase.quotes.length > 0 && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">Quotes:</span>
                <div className="mt-1 space-y-2">
                  {useCase.quotes.map((quote, idx) => (
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
              <span className="text-xs text-[var(--text-muted)]">Name:</span>
              <p className="text-sm font-medium text-[var(--text)] mt-1">{match.useCase.name}</p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Description:</span>
              <p className="text-sm text-[var(--text)] mt-1">{match.useCase.description || 'None'}</p>
            </div>
            {match.useCase.solutionId && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">Solution:</span>
                <p className="text-sm text-[var(--text)] mt-1">Linked to solution</p>
              </div>
            )}
            <div>
              <span className="text-xs text-[var(--text-muted)]">Last updated:</span>
              <p className="text-sm text-[var(--text)] mt-1">
                {formatRelativeTime(match.useCase.updatedAt)}
              </p>
            </div>
          </div>
        )}
      />
    </>
  );
});
