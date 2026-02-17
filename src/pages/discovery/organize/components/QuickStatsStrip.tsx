import type { StatEvaluation } from '../useDashboardData';
import { StatCard } from './StatCard';

interface QuickStatsStripProps {
  stats: StatEvaluation[];
  isLoading: boolean;
}

export function QuickStatsStrip({ stats, isLoading }: QuickStatsStripProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <StatCard
          key={stat.config.id}
          icon={stat.config.icon}
          label={stat.config.label}
          total={stat.total}
          weeklyDelta={stat.weeklyDelta}
          link={stat.config.link}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
