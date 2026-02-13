import { FiArrowRight, FiGitMerge } from 'react-icons/fi';
import { Spinner } from '@/shared/ui';

interface SimilarityConnectorProps {
  isChecking: boolean;
  isMerged: boolean;
}

/**
 * Visual connector between an extraction card and its similar entity card.
 * Shows "similar to" with an arrow, "merged into" after merge, or a spinner while checking.
 */
export function SimilarityConnector({ isChecking, isMerged }: SimilarityConnectorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2 flex-shrink-0 w-24">
      {isChecking ? (
        <>
          <Spinner size="sm" />
          <span className="text-xs text-[var(--text-muted)]">checking...</span>
        </>
      ) : isMerged ? (
        <>
          <FiGitMerge className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-xs text-[var(--primary)] font-medium">merged into</span>
        </>
      ) : (
        <>
          <FiArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)]">similar to</span>
        </>
      )}
    </div>
  );
}
