import { useState } from 'react';
import {
  FiArchive,
  FiAlertTriangle,
  FiAlertCircle,
  FiThumbsUp,
  FiHelpCircle,
  FiTrash2,
} from 'react-icons/fi';
import { Card } from '~/core/components/ui/Card';
import { Tag } from '~/core/components/ui/Tag';
import {
  FEEDBACK_TYPE_CONFIG,
  type ExtractedFeedback,
  type ExtractedPersona,
  type ExtractedUseCase,
  type FeedbackType,
  type SimilarFeedbackResult,
} from '~/core/entities/discovery';
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
}

// Icon mapping for feedback types
const FEEDBACK_ICONS: Record<FeedbackType, React.ReactNode> = {
  suggestion: <FiArchive className="w-5 h-5" />,
  problem: <FiAlertTriangle className="w-5 h-5" />,
  concern: <FiAlertCircle className="w-5 h-5" />,
  praise: <FiThumbsUp className="w-5 h-5" />,
  question: <FiHelpCircle className="w-5 h-5" />,
};

// Color mapping for feedback types
const FEEDBACK_COLORS: Record<FeedbackType, string> = {
  suggestion: 'bg-blue-500/10 text-blue-500',
  problem: 'bg-red-500/10 text-red-500',
  concern: 'bg-orange-500/10 text-orange-500',
  praise: 'bg-green-500/10 text-green-500',
  question: 'bg-purple-500/10 text-purple-500',
};

const TAG_COLORS: Record<FeedbackType, 'blue' | 'red' | 'orange' | 'green' | 'purple'> = {
  suggestion: 'blue',
  problem: 'red',
  concern: 'orange',
  praise: 'green',
  question: 'purple',
};

export function FeedbackResultCard({
  feedback,
  index,
  personas,
  useCases,
  onDelete,
  deletedPersonaIndexes,
  deletedUseCaseIndexes,
  similarFeedback,
  isCheckingSimilarity,
}: FeedbackResultCardProps) {
  const [selectedMatch, setSelectedMatch] = useState<SimilarFeedbackResult | null>(null);

  const config = FEEDBACK_TYPE_CONFIG[feedback.type];
  const icon = FEEDBACK_ICONS[feedback.type];
  const iconColor = FEEDBACK_COLORS[feedback.type];
  const tagColor = TAG_COLORS[feedback.type];

  // Get linked items (excluding deleted items)
  const linkedPersonas = (feedback.linkedPersonaIndexes ?? [])
    .filter((idx) => !deletedPersonaIndexes?.has(idx))
    .map((idx) => personas[idx])
    .filter(Boolean);

  const linkedUseCases = (feedback.linkedUseCaseIndexes ?? [])
    .filter((idx) => !deletedUseCaseIndexes?.has(idx))
    .map((idx) => useCases[idx])
    .filter(Boolean);

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
                {similarFeedback.length} similar {similarFeedback.length === 1 ? 'match' : 'matches'}
              </span>
            </button>
          ) : (
            <div />
          )}

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
        actionHint="If this is a duplicate, you can delete this feedback from the intake results before saving."
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
                <Tag color={TAG_COLORS[match.feedback.type]}>
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
}
