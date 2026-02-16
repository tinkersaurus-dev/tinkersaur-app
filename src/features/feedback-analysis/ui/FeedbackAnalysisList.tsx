import { useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardStack, Empty } from '@/shared/ui';
import { type Feedback } from '@/entities/feedback';
import type { IntakeSource } from '@/entities/intake-source';
import { TYPE_COLORS } from '../lib/constants';

interface FeedbackAnalysisListProps {
  feedback: Feedback[];
  childCountMap: Map<string, number>;
  selectedFeedbackId: string | null;
  onFeedbackClick: (feedbackId: string) => void;
  intakeSourceMap: Record<string, IntakeSource>;
  intakeSourceNameMap: Record<string, string>;
  gridClassName?: string;
}

export function FeedbackAnalysisList({
  feedback,
  childCountMap,
  selectedFeedbackId,
  onFeedbackClick,
  intakeSourceMap,
  intakeSourceNameMap,
  gridClassName,
}: FeedbackAnalysisListProps) {
  // Show only parents and ungrouped (not children)
  const visibleFeedback = useMemo(() => {
    return feedback
      .filter((f) => f.parentFeedbackId === null)
      .sort((a, b) => {
        const aCount = childCountMap.get(a.id) ?? 0;
        const bCount = childCountMap.get(b.id) ?? 0;
        if (bCount !== aCount) return bCount - aCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [feedback, childCountMap]);

  if (visibleFeedback.length === 0) {
    return <Empty description="No feedback to display." />;
  }

  return (
    <CardStack layout="grid" gap="sm" className={gridClassName ?? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-[1028px] mx-auto"}>
      {visibleFeedback.map((item) => {
        const isSelected = selectedFeedbackId === item.id;

        const intakeSource = item.intakeSourceId
          ? intakeSourceMap[item.intakeSourceId]
          : undefined;
        const intakeSourceName = item.intakeSourceId
          ? intakeSourceNameMap[item.intakeSourceId]
          : undefined;

        return (
          <Card
            key={item.id}
            shadow={false}
            hoverable
            onClick={() => onFeedbackClick(item.id)}
            className={`cursor-pointer transition-all py-0 border-[var(--border-muted)] border-t-1 border-b-1 !border-l-6 border-r-1 ${
              isSelected
                ? 'ring-2 ring-[var(--primary)]'
                : ''
            }`}
            style={{ borderLeftColor: TYPE_COLORS[item.type] }}
          >
            <div className="flex flex-col gap-2 h-full">
              <div className="flex items-start gap-2">
                <p className="text-[11px] text-[var(--text)] line-clamp-2 flex-1 min-w-0">
                  {item.content}
                </p>
                {(childCountMap.get(item.id) ?? 0) > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                    +{childCountMap.get(item.id)}
                  </span>
                )}
              </div>
              <div className="mt-auto">
                {intakeSourceName ? (
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    {intakeSourceName}
                    {intakeSource?.date && (
                      <span className="ml-1.5">
                        &middot; {format(new Date(intakeSource.date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-[10px] text-[var(--text-muted)] invisible">
                    &nbsp;
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </CardStack>
  );
}
