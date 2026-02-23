import { useMemo } from 'react';
import type {
  EntityData,
  DashboardRule,
  DashboardRuleResult,
  RuleResultItem,
  StatConfig,
} from './rules';
import { DASHBOARD_RULES, STAT_CONFIGS } from './rules';

// ── Types ──

export type EntityType = 'persona' | 'userGoal' | 'feedback' | 'outcome';
export type ActivityAction = 'created' | 'updated' | 'merged';

export interface ActivityItem {
  id: string;
  entityType: EntityType;
  action: ActivityAction;
  title: string;
  timestamp: Date;
}

export interface RuleEvaluation {
  rule: DashboardRule;
  count: number;
  items: RuleResultItem[];
}

export interface StatEvaluation {
  config: StatConfig;
  total: number;
  weeklyDelta: number;
}

export interface DashboardData {
  ruleResults: RuleEvaluation[];
  bannerResult: { rule: DashboardRule; count: number } | null;
  stats: StatEvaluation[];
  activities: ActivityItem[];
}

// ── Constants ──

const ONE_MINUTE_MS = 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ACTIVITY_ITEMS = 15;

// ── Hook ──

export function useDashboardData(data: EntityData): DashboardData {
  return useMemo(() => {
    // Evaluate all rules
    const ruleResults: RuleEvaluation[] = [];
    let bannerResult: { rule: DashboardRule; count: number } | null = null;

    for (const rule of DASHBOARD_RULES) {
      const result: DashboardRuleResult | null = rule.evaluate(data);
      if (result && result.count > 0) {
        ruleResults.push({ rule, count: result.count, items: result.items });
        if (!bannerResult && rule.bannerTemplate) {
          bannerResult = { rule, count: result.count };
        }
      }
    }

    // Compute stats
    // eslint-disable-next-line react-hooks/purity -- Date.now() is intentional; recalculated only when data changes
    const now = Date.now();
    const stats: StatEvaluation[] = STAT_CONFIGS.map((config) => {
      const items = config.getData(data);
      const weeklyDelta = items.filter(
        (item) => now - new Date(item.createdAt).getTime() < SEVEN_DAYS_MS,
      ).length;
      return { config, total: items.length, weeklyDelta };
    });

    // Build activity feed
    const activities: ActivityItem[] = [];

    for (const p of data.personas) {
      activities.push({
        id: p.id,
        entityType: 'persona',
        action: getAction(p.createdAt, p.updatedAt),
        title: p.name,
        timestamp: new Date(p.updatedAt),
      });
    }

    for (const ug of data.userGoals) {
      activities.push({
        id: ug.id,
        entityType: 'userGoal',
        action: getAction(ug.createdAt, ug.updatedAt),
        title: ug.name,
        timestamp: new Date(ug.updatedAt),
      });
    }

    for (const f of data.feedbacks) {
      activities.push({
        id: f.id,
        entityType: 'feedback',
        action: f.parentFeedbackId
          ? 'merged'
          : getAction(f.createdAt, f.updatedAt),
        title: f.content,
        timestamp: new Date(f.updatedAt),
      });
    }

    for (const o of data.outcomes) {
      activities.push({
        id: o.id,
        entityType: 'outcome',
        action: getAction(o.createdAt, o.updatedAt),
        title: o.description,
        timestamp: new Date(o.updatedAt),
      });
    }

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    activities.splice(MAX_ACTIVITY_ITEMS);

    return { ruleResults, bannerResult, stats, activities };
  }, [data]);
}

function getAction(createdAt: Date, updatedAt: Date): ActivityAction {
  const diff = Math.abs(
    new Date(updatedAt).getTime() - new Date(createdAt).getTime(),
  );
  return diff < ONE_MINUTE_MS ? 'created' : 'updated';
}
