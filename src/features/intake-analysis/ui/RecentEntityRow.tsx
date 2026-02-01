import { FiUser, FiClipboard, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';
import type { Persona } from '@/entities/persona';
import type { UseCase } from '@/entities/use-case';
import type { Feedback } from '@/entities/feedback';
import type { Outcome } from '@/entities/outcome';
import { FEEDBACK_TYPE_CONFIG } from '@/entities/feedback';
import { Tag } from '@/shared/ui/Tag';
import { formatRelativeTime } from '@/shared/lib/utils';
import { FEEDBACK_TAG_COLORS } from '../model/constants';

// Export icons for use in section headers
export const PersonaIcon = () => (
  <FiUser className="w-4 h-4 text-[var(--primary)]" />
);
export const UseCaseIcon = () => (
  <FiClipboard className="w-4 h-4 text-blue-500" />
);
export const FeedbackIcon = () => (
  <FiMessageSquare className="w-4 h-4 text-purple-500" />
);
export const OutcomeIcon = () => (
  <FiTrendingUp className="w-4 h-4 text-green-500" />
);

interface PersonaRowProps {
  persona: Persona;
}

export function PersonaRow({ persona }: PersonaRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-2 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-secondary)] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-[var(--text)] truncate">
          {persona.name}
        </div>
        {persona.role && (
          <div className="text-xs text-[var(--text-muted)] truncate">
            {persona.role}
          </div>
        )}
      </div>
      <div className="text-xs text-[var(--text-disabled)] flex-shrink-0 w-25">
        {formatRelativeTime(persona.createdAt)}
      </div>
    </div>
  );
}

interface UseCaseRowProps {
  useCase: UseCase;
}

export function UseCaseRow({ useCase }: UseCaseRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-2 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-secondary)] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-xs  font-medium text-[var(--text)] truncate">
          {useCase.name}
        </div>
      </div>
      <div className="text-xs text-[var(--text-disabled)] flex-shrink-0 w-25">
        {formatRelativeTime(useCase.createdAt)}
      </div>
    </div>
  );
}

interface FeedbackRowProps {
  feedback: Feedback;
}

export function FeedbackRow({ feedback }: FeedbackRowProps) {
  const config = FEEDBACK_TYPE_CONFIG[feedback.type];
  const tagColor = FEEDBACK_TAG_COLORS[feedback.type];

  return (
    <div className="flex items-center gap-3 py-2 px-2 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-secondary)] transition-colors">

      <div className="flex-1 min-w-0">
        <div className="text-xs text-[var(--text)] truncate">
          {feedback.content}
        </div>

      </div>
      <Tag color={tagColor} className="flex-shrink-0 text-xs">
        {config.label}
      </Tag>
      <div className="text-xs text-[var(--text-disabled)] flex-shrink-0 w-25">
        {formatRelativeTime(feedback.createdAt)}
      </div>
    </div>
  );
}

interface OutcomeRowProps {
  outcome: Outcome;
}

export function OutcomeRow({ outcome }: OutcomeRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-2 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-secondary)] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-[var(--text)] truncate">
          {outcome.description}
        </div>
        {outcome.target && (
          <div className="text-xs text-[var(--text-muted)] truncate">
            {outcome.target}
          </div>
        )}
      </div>
      <div className="text-xs text-[var(--text-disabled)] flex-shrink-0 w-25">
        {formatRelativeTime(outcome.createdAt)}
      </div>
    </div>
  );
}
