import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Card, Spinner } from '@/shared/ui';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  total: number;
  weeklyDelta: number;
  link: string;
  isLoading: boolean;
}

export function StatCard({
  icon,
  label,
  total,
  weeklyDelta,
  link,
  isLoading,
}: StatCardProps) {
  return (
    <Link to={link} className="block">
      <Card hoverable shadow={false} contentClassName="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--primary)]/8 flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
              {label}
            </div>
            {isLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <div className="text-xl font-bold text-[var(--text)] leading-tight">
                  {total}
                </div>
                {weeklyDelta > 0 ? (
                  <div className="text-sm text-green-500 mt-0.5">
                    +{weeklyDelta} this week
                  </div>
                ) : (
                  <div className="text-sm text-[var(--text-disabled)] mt-0.5">
                    0 this week
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
