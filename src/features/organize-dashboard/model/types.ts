import type { ReactNode } from 'react';
import type { Persona } from '@/entities/persona';
import type { UserGoal } from '@/entities/user-goal';
import type { Feedback } from '@/entities/feedback';
import type { Outcome } from '@/entities/outcome';
import type { TagColor } from '@tinkersaur/ui';

// ── From rules.tsx ──

export interface EntityData {
  personas: Persona[];
  userGoals: UserGoal[];
  feedbacks: Feedback[];
  outcomes: Outcome[];
}

export interface RuleResultItem {
  id: string;
  title: string;
  subtitle?: string;
  tags?: { label: string; color: TagColor }[];
}

export interface DashboardRuleResult {
  count: number;
  items: RuleResultItem[];
}

export interface DashboardRule {
  id: string;
  title: string;
  icon: ReactNode;
  severity: 'warning' | 'info';
  actionLink: string;
  actionLabel: string;
  /** If set, this rule can produce a top-of-page banner. Uses {count} placeholder. */
  bannerTemplate?: string;
  /** Evaluate against entity data. Return null if nothing to surface. */
  evaluate: (data: EntityData) => DashboardRuleResult | null;
}

export interface StatConfig {
  id: string;
  label: string;
  icon: ReactNode;
  getData: (data: EntityData) => { id: string; createdAt: Date }[];
  link: string;
}

// ── From useDashboardData.ts ──

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
