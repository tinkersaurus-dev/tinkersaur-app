import { FiX, FiGitMerge, FiMessageSquare, FiClipboard, FiTarget } from 'react-icons/fi';
import { HStack } from '@/shared/ui';
import type { InlineSimilarityMatch } from '../../model/types';
import type { SimilarFeedbackResult } from '@/entities/feedback';
import type { SimilarUserGoalResult } from '@/entities/user-goal';
import type { SimilarOutcomeResult } from '@/entities/outcome';

interface SimilarEntityCardProps {
  match: InlineSimilarityMatch;
  isMergeTarget?: boolean;
  onDismiss?: () => void;
  onMerge?: () => void;
  onUndo?: () => void;
}

const typeIcons: Record<string, typeof FiMessageSquare> = {
  feedback: FiMessageSquare,
  userGoals: FiClipboard,
  outcomes: FiTarget,
};

/**
 * Card displaying a similar existing entity from the database.
 * Has a dark grey border (not type-colored) and shows similarity percentage.
 */
export function SimilarEntityCard({
  match,
  isMergeTarget = false,
  onDismiss,
  onMerge,
  onUndo,
}: SimilarEntityCardProps) {
  const Icon = typeIcons[match.entityType] ?? FiTarget;

  const renderContent = () => {
    switch (match.entityType) {
      case 'feedback': {
        const r = match.result as SimilarFeedbackResult;
        return (
          <p className="text-sm line-clamp-2">
            <span className="capitalize font-bold">{r.feedback.type}:</span> {r.feedback.content}
          </p>
        );
      }
      case 'userGoals': {
        const r = match.result as SimilarUserGoalResult;
        return (
          <>
            <h4 className="text-sm font-bold">User Goal: {r.userGoal.name}</h4>
            <p className="text-sm mt-1 line-clamp-2">{r.userGoal.description}</p>
          </>
        );
      }
      case 'outcomes': {
        const r = match.result as SimilarOutcomeResult;
        return (
          <>
            <p className="text-sm font-bold">Outcome: {r.outcome.description}</p>
            <p className="text-sm text-[var(--text-muted)] font-medium mt-1">
              Target: {r.outcome.target}
            </p>
          </>
        );
      }
      default:
        return <p className="text-sm">Unknown entity type</p>;
    }
  };

  const similarityPercent = Math.round(match.similarity * 100);

  return (
    <div
      className={`p-3 border border-gray-400 border-l-[6px] border-l-gray-400 transition-all max-w-4xl ${
        isMergeTarget ? 'opacity-80' : ''
      }`}
    >
      <HStack justify="between" align="center">
        <HStack justify="between" align="center" gap="md">
          <Icon className="w-4 h-4 flex-shrink-0 text-gray-500" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-light)] text-[var(--text-muted)] font-medium">
                {similarityPercent}% match
              </span>
              {isMergeTarget && (
                <span className="text-xs text-[var(--primary)] font-medium">merge target</span>
              )}
            </div>
            {renderContent()}
          </div>
        </HStack>

        <div className="flex justify-end gap-1 flex-shrink-0">
          {isMergeTarget && onUndo ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUndo();
              }}
              className="p-1.5 rounded hover:bg-[var(--tag-bg-red)] text-[var(--danger)] transition-colors"
              title="Undo merge"
            >
              <FiX className="w-4 h-4" />
            </button>
          ) : (
            <>
              {onDismiss && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  className="p-1.5 rounded hover:bg-[var(--tag-bg-red)] text-[var(--text-muted)] transition-colors"
                  title="Dismiss"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
              {onMerge && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMerge();
                  }}
                  className="p-1.5 rounded hover:bg-[var(--tag-bg-green)] text-[var(--primary)] transition-colors"
                  title="Merge into existing"
                >
                  <FiGitMerge className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </HStack>
    </div>
  );
}
