import type { ReactNode } from 'react';
import { Empty } from '~/core/components/ui/Empty';

interface DashboardListSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  isEmpty?: boolean;
  isLoading?: boolean;
  emptyDescription?: string;
}

export function DashboardListSection({
  title,
  icon,
  children,
  isEmpty = false,
  isLoading = false,
  emptyDescription = 'No items yet',
}: DashboardListSectionProps) {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-light)] rounded-[5px] border border-[var(--border-muted)] [box-shadow:var(--shadow)] p-6 pr-1">
      <h3 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2 flex-shrink-0">
        {icon}
        {title}
      </h3>
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
