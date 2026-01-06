import { useState } from 'react';
import {
  FiStar,
  FiAlertTriangle,
  FiAlertCircle,
  FiThumbsUp,
  FiHelpCircle,
  FiUsers,
  FiClipboard,
  FiChevronDown,
  FiChevronUp,
  FiTrash2,
} from 'react-icons/fi';
import { LuX } from 'react-icons/lu';
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
import { ConfidenceBadge } from './ConfidenceBadge';
import { QuotesList } from './QuoteHighlight';
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
  suggestion: <FiStar className="w-5 h-5" />,
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
  const [isExpanded, setIsExpanded] = useState(true);
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
  const hasDetails = hasLinks || feedback.context || feedback.quotes.length > 0;

  return (
    <>
      <Card className="h-full flex flex-col">
        {/* Checking state */}
        {isCheckingSimilarity && (
          <div className="mb-3 px-4 py-2.5 bg-[var(--bg-secondary)] rounded-lg text-xs text-[var(--text-muted)]">
            Checking for similar feedback...
          </div>
        )}

        {/* Similarity Banner */}
        {similarFeedback && similarFeedback.length > 0 && (
          <button
            onClick={() => setSelectedMatch(similarFeedback[0])}
            className="mb-3 w-full px-4 py-2.5 bg-[var(--warning)]/10 border-2 border-[var(--warning)] rounded-lg text-left hover:bg-[var(--warning)]/20 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                <span className="text-sm font-semibold text-[var(--text)]">
                  {similarFeedback.length} similar feedback {similarFeedback.length === 1 ? 'item' : 'items'} found
                </span>
              </div>
              <span className="text-xs font-medium text-[var(--warning)]">
                Click to compare →
              </span>
            </div>
          </button>
        )}

        {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${iconColor}`}>{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <Tag color={tagColor}>{config.label}</Tag>
              <ConfidenceBadge confidence={feedback.confidence} />
            </div>
          </div>
        </div>
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

      {/* Content */}
      <p className="text-sm text-[var(--text)] mt-4 font-medium">
        {feedback.content}
      </p>

      {/* Expandable details */}
      {hasDetails && (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-[var(--primary)] mt-4 hover:underline"
          >
            {isExpanded ? (
              <>
                <FiChevronUp className="w-4 h-4" />
                Hide details
              </>
            ) : (
              <>
                <FiChevronDown className="w-4 h-4" />
                Show details
              </>
            )}
          </button>

          {isExpanded && (
            <div className="mt-4 space-y-4 flex-1">
              {/* Context */}
              {feedback.context && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Context
                  </h4>
                  <p className="text-sm text-[var(--text-muted)]">
                    {feedback.context}
                  </p>
                </div>
              )}

              {/* Linked Personas */}
              {linkedPersonas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FiUsers className="w-4 h-4 text-[var(--primary)]" />
                    <h4 className="text-sm font-medium text-[var(--text)]">
                      Related Personas
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {linkedPersonas.map((persona, i) => (
                      <Tag key={i}>{persona.name}</Tag>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Use Cases */}
              {linkedUseCases.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FiClipboard className="w-4 h-4 text-blue-500" />
                    <h4 className="text-sm font-medium text-[var(--text)]">
                      Related Use Cases
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {linkedUseCases.map((uc, i) => (
                      <Tag key={i} color="blue">
                        {uc.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotes */}
              {feedback.quotes.length > 0 && (
                <QuotesList quotes={feedback.quotes} maxVisible={2} />
              )}
            </div>
          )}
        </>
      )}

        {/* Index badge */}
        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--text-muted)]">
            Feedback #{index + 1}
          </span>
        </div>
      </Card>

      {/* Similarity Details Bottom Drawer */}
      {selectedMatch !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="w-full max-h-[80vh] bg-[var(--bg)] border-t border-[var(--border)] shadow-xl flex flex-col animate-slide-in-bottom overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-[var(--border)]">
              <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="w-5 h-5 text-[var(--warning)]" />
                    <h3 className="text-lg font-semibold text-[var(--text)]">Similar Feedback Found</h3>
                  </div>
                  <Tag
                    color={
                      selectedMatch.similarity > 0.8
                        ? 'red'
                        : selectedMatch.similarity > 0.5
                        ? 'orange'
                        : 'blue'
                    }
                  >
                    {Math.round(selectedMatch.similarity * 100)}% match
                  </Tag>
                  <Tag color="default">{selectedMatch.matchType} match</Tag>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-2 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <LuX className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>
            </div>

            {/* Content - Three Column Layout */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-[1400px] mx-auto grid gap-6" style={{ gridTemplateColumns: '1fr 1fr 300px' }}>
                {/* New Feedback from Intake - Left Column */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">New Feedback (from intake)</h3>
                  <Card>
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
                      {feedback.context && (
                        <div>
                          <span className="text-xs text-[var(--text-muted)]">Context:</span>
                          <p className="text-sm text-[var(--text)] mt-1">{feedback.context}</p>
                        </div>
                      )}
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
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Confidence:</span>
                        <p className="text-sm text-[var(--text)] mt-1">{Math.round(feedback.confidence * 100)}%</p>
                      </div>
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
                  </Card>
                </div>

                {/* Existing Feedback - Middle Column */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Existing Feedback</h3>
                  <Card className="border-2 border-[var(--primary)]">
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Content:</span>
                        <p className="text-sm font-medium text-[var(--text)] mt-1">{selectedMatch.feedback.content}</p>
                      </div>
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Type:</span>
                        <div className="mt-1">
                          <Tag color={TAG_COLORS[selectedMatch.feedback.type]}>
                            {FEEDBACK_TYPE_CONFIG[selectedMatch.feedback.type].label}
                          </Tag>
                        </div>
                      </div>
                      {selectedMatch.feedback.context && (
                        <div>
                          <span className="text-xs text-[var(--text-muted)]">Context:</span>
                          <p className="text-sm text-[var(--text)] mt-1">{selectedMatch.feedback.context}</p>
                        </div>
                      )}
                      {selectedMatch.feedback.solutionId && (
                        <div>
                          <span className="text-xs text-[var(--text-muted)]">Solution:</span>
                          <p className="text-sm text-[var(--text)] mt-1">Linked to solution</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Last updated:</span>
                        <p className="text-sm text-[var(--text)] mt-1">
                          {formatRelativeTime(selectedMatch.feedback.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)]">
                      If this is a duplicate, you can delete this feedback from the intake results before saving.
                    </p>
                  </div>
                </div>

                {/* All Matches List - Right Column (300px fixed) */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                    All Matches ({similarFeedback?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {similarFeedback?.map((match, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedMatch(match)}
                        className={`w-full p-3 rounded border text-left transition-colors ${
                          selectedMatch.feedback.id === match.feedback.id
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-[var(--text)] line-clamp-2">
                              {match.feedback.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tag
                              color={
                                match.similarity > 0.8
                                  ? 'red'
                                  : match.similarity > 0.5
                                  ? 'orange'
                                  : 'blue'
                              }
                            >
                              {Math.round(match.similarity * 100)}%
                            </Tag>
                            <span className="text-xs text-[var(--text-muted)]">
                              {match.matchType}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
