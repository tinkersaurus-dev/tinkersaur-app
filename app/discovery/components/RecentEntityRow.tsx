import { FiUser, FiClipboard, FiMessageSquare } from 'react-icons/fi';
import type { Persona } from '~/core/entities/product-management';
import type { UseCase } from '~/core/entities/product-management';
import type { Feedback, FeedbackType } from '~/core/entities/discovery';
import { FEEDBACK_TYPE_CONFIG } from '~/core/entities/discovery';
import { Tag } from '~/core/components/ui/Tag';
import { formatRelativeTime } from '~/core/utils/formatRelativeTime';

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

// Badge color mapping for feedback types
const FEEDBACK_TAG_COLORS: Record<
  FeedbackType,
  'blue' | 'red' | 'orange' | 'green' | 'purple'
> = {
  suggestion: 'blue',
  problem: 'red',
  concern: 'orange',
  praise: 'green',
  question: 'purple',
};

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
