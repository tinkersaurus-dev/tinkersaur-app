import { useMemo } from 'react';
import { Card, Empty } from '@/shared/ui';
import { type Feedback, FEEDBACK_TYPE_CONFIG, FEEDBACK_TAG_COLORS } from '@/entities/feedback';
import { Tag } from '@/shared/ui';
import { TYPE_COLORS } from '@/features/feedback-analysis';

interface SignalFeedbackListProps {
  feedback: Feedback[];
  childCountMap: Map<string, number>;
}

export function SignalFeedbackList({ feedback, childCountMap }: SignalFeedbackListProps) {
  // Show only parents and unparented (not children), sorted by child count desc then date desc
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
    <div className="flex flex-col gap-1.5">
      {visibleFeedback.map((item) => {
        const childCount = childCountMap.get(item.id) ?? 0;
        const config = FEEDBACK_TYPE_CONFIG[item.type];

        return (
          <Card
            key={item.id}
            shadow={false}
            className="py-0 px-0 border-[var(--border-muted)] !border-l-4"
            style={{ borderLeftColor: TYPE_COLORS[item.type] }}
          >
            <div className="px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Tag color={FEEDBACK_TAG_COLORS[item.type]} className="!text-[9px] !px-1.5 !py-0">
                  {config.label}
                </Tag>
                {childCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
                    +{childCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text)] line-clamp-2 leading-relaxed">
                {item.content}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
