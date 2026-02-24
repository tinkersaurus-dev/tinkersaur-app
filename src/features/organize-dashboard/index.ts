// Types
export type {
  EntityData,
  DashboardRule,
  RuleResultItem,
  DashboardRuleResult,
  StatConfig,
  EntityType,
  ActivityAction,
  ActivityItem,
  RuleEvaluation,
  StatEvaluation,
  DashboardData,
} from './model/types';

// Logic
export { DASHBOARD_RULES, STAT_CONFIGS } from './lib/rules';
export { useDashboardData } from './lib/useDashboardData';

// UI
export {
  DashboardBanner,
  QuickStatsStrip,
  AttentionGrid,
  ActivityFeed,
  StatCard,
  AttentionCard,
} from './ui';
