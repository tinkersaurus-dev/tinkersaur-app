import { Card, Tag, Empty } from '@/shared/ui';
import {
  PersonaIcon,
  UseCaseIcon,
  FeedbackIcon,
  OutcomeIcon,
} from '@/shared/ui';
import { formatRelativeTime } from '@/shared/lib/utils';
import type { ActivityItem, EntityType, ActivityAction } from '../useDashboardData';
import type { TagColor } from '@tinkersaur/ui';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
  persona: <PersonaIcon />,
  userGoal: <UseCaseIcon />,
  feedback: <FeedbackIcon />,
  outcome: <OutcomeIcon />,
};

const ENTITY_BORDER_COLORS: Record<EntityType, string> = {
  persona: 'border-l-purple-400',
  userGoal: 'border-l-blue-400',
  feedback: 'border-l-orange-400',
  outcome: 'border-l-green-400',
};

const ACTION_CONFIG: Record<ActivityAction, { label: string; color: TagColor }> = {
  created: { label: 'added', color: 'green' },
  updated: { label: 'updated', color: 'blue' },
  merged: { label: 'merged', color: 'purple' },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Recent Activity
      </h2>
      <Card shadow={false} contentClassName="p-0">
        {activities.length === 0 ? (
          <div className="p-6">
            <Empty description="No recent activity" />
          </div>
        ) : (
          <div>
            {activities.map((activity, index) => {
              const actionCfg = ACTION_CONFIG[activity.action];
              const borderColor = ENTITY_BORDER_COLORS[activity.entityType];
              const icon = ENTITY_ICONS[activity.entityType];

              return (
                <div
                  key={`${activity.id}-${index}`}
                  className={`flex items-center gap-2.5 h-9 px-3.5 border-l-3 ${borderColor} border-b border-b-[var(--border)]/50 last:border-b-0 hover:bg-[var(--bg-secondary)] transition-colors`}
                >
                  <span className="flex-shrink-0 w-4 text-center">
                    {icon}
                  </span>
                  <Tag
                    color={actionCfg.color}
                    className="flex-shrink-0 text-xs min-w-[3rem] justify-center"
                  >
                    {actionCfg.label}
                  </Tag>
                  <span className="flex-1 text-sm text-[var(--text-muted)] truncate">
                    {activity.title}
                  </span>
                  <span className="text-sm text-[var(--text-disabled)] flex-shrink-0 whitespace-nowrap">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
