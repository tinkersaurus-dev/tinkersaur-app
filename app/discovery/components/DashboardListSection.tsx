import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Empty } from '@/shared/ui/Empty';

interface DashboardListSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  isEmpty?: boolean;
  isLoading?: boolean;
  emptyDescription?: string;
  viewAllLink?: string;
}

export function DashboardListSection({
  title,
  icon,
  children,
  isEmpty = false,
  isLoading = false,
  emptyDescription = 'No items yet',
  viewAllLink,
}: DashboardListSectionProps) {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-light)] rounded-[5px] border border-[var(--border-muted)] [box-shadow:var(--shadow)] p-6 pr-1">
      <div className="flex items-center justify-between mb-3 flex-shrink-0 pr-5">
        <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            View All →
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-[var(--text-muted)]">Loading...</div>
          </div>
        ) : isEmpty ? (
          <Empty description={emptyDescription} />
        ) : (
          <div className="space-y-0">{children}</div>
        )}
      </div>
    </div>
  );
}
