import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Card, Tag } from '@/shared/ui';
import type { RuleResultItem } from '../rules';

interface AttentionCardProps {
  title: string;
  icon: ReactNode;
  count: number;
  items: RuleResultItem[];
  actionLabel: string;
  actionLink: string;
}

export function AttentionCard({
  title,
  icon,
  count,
  items,
  actionLabel,
  actionLink,
}: AttentionCardProps) {
  return (
    <Card contentClassName="p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="flex-shrink-0">{icon}</span>
        <span className="text-xs font-semibold text-[var(--text)] flex-1">
          {title}
        </span>
        <Tag color="orange" className="flex-shrink-0">
          {count}
        </Tag>
      </div>

      {/* Item List */}
      <div className="flex-1 space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="px-2.5 py-2 rounded-sm bg-amber-500/[0.03] border-l-2 border-l-amber-500/25 text-xs"
          >
            <div className="text-[var(--text-muted)] truncate leading-snug">
              {item.title}
            </div>
            {(item.subtitle || item.tags) && (
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[var(--text-disabled)]">
                {item.tags?.map((tag) => (
                  <Tag key={tag.label} color={tag.color} className="text-[9px]">
                    {tag.label}
                  </Tag>
                ))}
                {item.subtitle && <span>{item.subtitle}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2.5 border-t border-[var(--border)]">
        <Link
          to={actionLink}
          className="text-xs font-medium text-[var(--primary)] hover:underline"
        >
          {actionLabel} {count} &rarr;
        </Link>
      </div>
    </Card>
  );
}
