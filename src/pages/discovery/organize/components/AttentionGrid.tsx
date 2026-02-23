import type { RuleEvaluation } from '../useDashboardData';
import { AttentionCard } from './AttentionCard';

interface AttentionGridProps {
  ruleResults: RuleEvaluation[];
}

export function AttentionGrid({ ruleResults }: AttentionGridProps) {
  if (ruleResults.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Needs Attention
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {ruleResults.map((result) => (
          <AttentionCard
            key={result.rule.id}
            title={result.rule.title}
            icon={result.rule.icon}
            count={result.count}
            items={result.items}
            actionLabel={result.rule.actionLabel}
            actionLink={result.rule.actionLink}
          />
        ))}
      </div>
    </div>
  );
}
