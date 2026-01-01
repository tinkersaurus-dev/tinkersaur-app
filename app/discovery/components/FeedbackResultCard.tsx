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
} from 'react-icons/fi';
import { Card } from '~/core/components/ui/Card';
import { Tag } from '~/core/components/ui/Tag';
import {
  FEEDBACK_TYPE_CONFIG,
  type ExtractedFeedback,
  type ExtractedPersona,
  type ExtractedUseCase,
  type FeedbackType,
} from '~/core/entities/discovery';
import { ConfidenceBadge } from './ConfidenceBadge';
import { QuotesList } from './QuoteHighlight';

interface FeedbackResultCardProps {
  feedback: ExtractedFeedback;
  index: number;
  personas: ExtractedPersona[];
  useCases: ExtractedUseCase[];
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
}: FeedbackResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const config = FEEDBACK_TYPE_CONFIG[feedback.type];
  const icon = FEEDBACK_ICONS[feedback.type];
  const iconColor = FEEDBACK_COLORS[feedback.type];
  const tagColor = TAG_COLORS[feedback.type];

  // Get linked items
  const linkedPersonas = feedback.linkedPersonaIndexes
    .map((idx) => personas[idx])
    .filter(Boolean);

  const linkedUseCases = feedback.linkedUseCaseIndexes
    .map((idx) => useCases[idx])
    .filter(Boolean);

  const hasLinks = linkedPersonas.length > 0 || linkedUseCases.length > 0;
  const hasDetails = hasLinks || feedback.context || feedback.quotes.length > 0;

  return (
    <Card className="h-full flex flex-col">
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
  );
}
