import { FiUser, FiGitMerge } from 'react-icons/fi';
import type { SimilarPersonaResult } from '@/entities/persona';
import { formatRelativeTime } from '@/shared/lib/utils';

interface PersonaMatchCardProps {
  match: SimilarPersonaResult;
  onMerge: () => void;
}

export function PersonaMatchCard({ match, onMerge }: PersonaMatchCardProps) {
  const similarityPercent = Math.round(match.similarity * 100);

  return (
    <div className="p-2 bg-white border border-[var(--border)]">
      <div className="flex items-start gap-2">
        <FiUser className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <h5 className="text-xs font-medium text-[var(--text)] truncate">
              {match.persona.name}
            </h5>
            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--warning)]/10 text-[var(--warning)] flex-shrink-0">
              {similarityPercent}% match
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] truncate">
            {match.persona.role}
          </p>
          <p className="text-[10px] text-[var(--text-disabled)]">
            Updated {formatRelativeTime(match.persona.updatedAt)}
          </p>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <button
          onClick={onMerge}
          className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
        >
          <FiGitMerge className="w-3 h-3" />
          Merge
        </button>
      </div>
    </div>
  );
}
