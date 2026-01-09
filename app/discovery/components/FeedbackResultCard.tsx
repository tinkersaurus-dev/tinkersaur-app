import { useState, memo, useMemo } from 'react';
import { FiAlertCircle, FiTrash2, FiGitMerge } from 'react-icons/fi';
import { Card } from '~/core/components/ui/Card';
import { Tag } from '~/core/components/ui/Tag';
import { Select } from '~/core/components/ui/Select';
import { Button } from '~/core/components/ui/Button';
import {
  FEEDBACK_TYPE_CONFIG,
  type ExtractedFeedback,
  type ExtractedPersona,
  type ExtractedUseCase,
  type SimilarFeedbackResult,
} from '~/core/entities/discovery';
import type { Solution } from '~/core/entities/product-management/types';
import { FEEDBACK_ICONS, FEEDBACK_ICON_COLORS, FEEDBACK_TAG_COLORS } from '~/discovery/constants';
import { QuotesList } from './QuoteHighlight';
import { SimilarityComparisonDrawer } from './SimilarityComparisonDrawer';
import { formatRelativeTime } from '~/core/utils/formatRelativeTime';

interface FeedbackResultCardProps {
  feedback: ExtractedFeedback;
  index: number;
  personas: ExtractedPersona[];
  useCases: ExtractedUseCase[];
  onDelete?: (index: number) => void;
  deletedPersonaIndexes?: Set<number>;
  deletedUseCaseIndexes?: Set<number>;
  similarFeedback?: SimilarFeedbackResult[];
  isCheckingSimilarity?: boolean;
  solutions: Solution[];
  selectedSolutionId: string | null;
  onSolutionChange: (index: number, solutionId: string | null) => void;
  onMerge?: (intakeFeedbackIndex: number, existingFeedbackId: string) => void;
}

export const FeedbackResultCard = memo(function FeedbackResultCard({
  feedback,
  index,
  personas,
  useCases,
  onDelete,
  deletedPersonaIndexes,
  deletedUseCaseIndexes,
  similarFeedback,
  isCheckingSimilarity,
  solutions,
  selectedSolutionId,
  onSolutionChange,
  onMerge,
}: FeedbackResultCardProps) {
  const [selectedMatch, setSelectedMatch] = useState<SimilarFeedbackResult | null>(null);

  const solutionOptions = useMemo(() => [
    { value: '', label: 'No solution' },
    ...solutions.map((s) => ({ value: s.id, label: s.name })),
  ], [solutions]);

  const config = FEEDBACK_TYPE_CONFIG[feedback.type];
  const icon = FEEDBACK_ICONS[feedback.type];
  const iconColor = FEEDBACK_ICON_COLORS[feedback.type];
  const tagColor = FEEDBACK_TAG_COLORS[feedback.type];

  // Get linked items (excluding deleted items) - memoized to prevent recalculation
  const linkedPersonas = useMemo(() =>
    (feedback.linkedPersonaIndexes ?? [])
      .filter((idx) => !deletedPersonaIndexes?.has(idx))
      .map((idx) => personas[idx])
      .filter(Boolean),
    [feedback.linkedPersonaIndexes, deletedPersonaIndexes, personas]
  );

  const linkedUseCases = useMemo(() =>
    (feedback.linkedUseCaseIndexes ?? [])
      .filter((idx) => !deletedUseCaseIndexes?.has(idx))
      .map((idx) => useCases[idx])
      .filter(Boolean),
    [feedback.linkedUseCaseIndexes, deletedUseCaseIndexes, useCases]
  );

  const hasLinks = linkedPersonas.length > 0 || linkedUseCases.length > 0;
  const hasDetails = hasLinks || feedback.quotes.length > 0;

  return (
    <>
      <Card className="h-full flex flex-col">
        {/* Checking state */}
        {isCheckingSimilarity && (
          <div className="mb-3 px-4 py-2.5 bg-[var(--bg-secondary)] rounded-lg text-xs text-[var(--text-muted)]">
            Checking for similar feedback...
          </div>
        )}

        {/* Content */}
        <div className="flex items-start gap-3">
          <div className={`p-1 rounded-md ${iconColor} flex-shrink-0`}>{icon}</div>
          <p className="text-sm text-[var(--text)] font-medium">
            {feedback.content}
          </p>
        </div>

      {/* Details */}
      {hasDetails && (
        <div className="mt-4 space-y-4 flex-1">

          {/* Quotes */}
          {feedback.quotes.length > 0 && (
            <QuotesList quotes={feedback.quotes} maxVisible={2} />
          )}
        </div>
      )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
          {/* Similarity indicator */}
          {similarFeedback && similarFeedback.length > 0 ? (
            <button
              onClick={() => setSelectedMatch(similarFeedback[0])}
              className="px-3 py-1.5 bg-[var(--warning)]/10 border border-[var(--warning)] rounded-lg text-left hover:bg-[var(--warning)]/20 transition-colors flex items-center gap-1.5"
            >
              <FiAlertCircle className="w-3.5 h-3.5 text-[var(--warning)]" />
              <span className="text-xs font-medium text-[var(--text)]">
                {similarFeedback.length} similar {similarFeedback.length === 1 ? 'piece of feedback' : 'pieces of feedback'}
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
                title="Remove feedback"
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
        title="Similar Feedback Found"
        selectedMatch={selectedMatch}
        getSimilarity={(m) => m.similarity}
        getMatchType={(m) => m.matchType}
        allMatches={similarFeedback ?? []}
        onSelectMatch={setSelectedMatch}
        getMatchId={(m) => m.feedback.id}
        newItemLabel="New Feedback (from intake)"
        existingItemLabel="Existing Feedback"
        actionHint={
          <div className="space-y-3">
            <p>If this is a duplicate, you can delete this feedback from the intake results before saving.</p>
            {onMerge && selectedMatch && (
              <Button
                variant="default"
                size="small"
                icon={<FiGitMerge className="w-3.5 h-3.5" />}
                onClick={() => {
                  onMerge(index, selectedMatch.feedback.id);
                  setSelectedMatch(null);
                }}
              >
                Merge as Child
              </Button>
            )}
          </div>
        }
        renderMatchListItem={(match) => (
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-[var(--text)] line-clamp-2">
              {match.feedback.content}
            </p>
          </div>
        )}
        renderNewItem={() => (
          <div className="space-y-4">
            <div>
              <span className="text-xs text-[var(--text-muted)]">Content:</span>
              <p className="text-sm font-medium text-[var(--text)] mt-1">{feedback.content}</p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Type:</span>
              <div className="mt-1">
                <Tag color={tagColor}>{config.label}</Tag>
              </div>
            </div>
            {feedback.quotes && feedback.quotes.length > 0 && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">Quotes:</span>
                <div className="mt-1 space-y-2">
                  {feedback.quotes.map((quote, idx) => (
                    <div key={idx} className="pl-3 border-l-2 border-[var(--border)]">
                      <p className="text-xs italic text-[var(--text-muted)]">"{quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {linkedPersonas.length > 0 && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">Linked Personas:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {linkedPersonas.map((persona, i) => (
                    <Tag key={i}>{persona.name}</Tag>
                  ))}
                </div>
              </div>
            )}
            {linkedUseCases.length > 0 && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">Linked Use Cases:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {linkedUseCases.map((uc, i) => (
                    <Tag key={i} color="blue">{uc.name}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        renderExistingItem={(match) => (
          <div className="space-y-4">
            <div>
              <span className="text-xs text-[var(--text-muted)]">Content:</span>
              <p className="text-sm font-medium text-[var(--text)] mt-1">{match.feedback.content}</p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Type:</span>
              <div className="mt-1">
                <Tag color={FEEDBACK_TAG_COLORS[match.feedback.type]}>
                  {FEEDBACK_TYPE_CONFIG[match.feedback.type].label}
                </Tag>
              </div>
            </div>
            {match.feedback.solutionId && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">Solution:</span>
                <p className="text-sm text-[var(--text)] mt-1">Linked to solution</p>
              </div>
            )}
            <div>
              <span className="text-xs text-[var(--text-muted)]">Last updated:</span>
              <p className="text-sm text-[var(--text)] mt-1">
                {formatRelativeTime(match.feedback.updatedAt)}
              </p>
            </div>
          </div>
        )}
      />
    </>
  );
});
