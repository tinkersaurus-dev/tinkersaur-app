import { Card } from '@/shared/ui';
import type { TagSignal } from '../lib/types';

interface TagSignalCardProps {
  signal: TagSignal;
  isSelected: boolean;
  onClick: () => void;
}

export function TagSignalCard({ signal, isSelected, onClick }: TagSignalCardProps) {
  return (
    <Card
      shadow={false}
      hoverable
      onClick={onClick}
      className={`cursor-pointer transition-all py-0 px-0 ${
        isSelected ? 'ring-2 ring-[var(--primary)]' : ''
      }`}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[var(--text)] truncate mr-2">
            {signal.tagName}
          </span>
          <span className="text-xs font-bold text-[var(--text)] tabular-nums shrink-0">
            {Math.round(signal.signalStrength)}
          </span>
        </div>

        {/* Strength bar */}
        <div className="h-[3px] bg-[var(--border-muted)] rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${signal.normalizedStrength}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--primary-hover))',
            }}
          />
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span>{signal.feedbackCount} feedback</span>
          <span>&middot;</span>
          <span>{signal.uniquePersonaCount} personas</span>
          <span>&middot;</span>
          <span>{signal.uniqueSourceCount} sources</span>
        </div>
      </div>
    </Card>
  );
}
