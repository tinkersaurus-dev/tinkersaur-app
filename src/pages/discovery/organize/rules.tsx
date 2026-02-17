import type { ReactNode } from 'react';
import type { Persona } from '@/entities/persona';
import type { UseCase } from '@/entities/use-case';
import type { Feedback } from '@/entities/feedback';
import type { Outcome } from '@/entities/outcome';
import type { TagColor } from '@tinkersaur/ui';
import { FEEDBACK_TYPE_CONFIG, FEEDBACK_TAG_COLORS, isUnlinkedFeedback } from '@/entities/feedback';
import { getDaysSinceUpdate, filterStalePersonas } from '@/entities/persona';
import { filterWeakEvidenceUseCases } from '@/entities/use-case';
import { filterUnlinkedOutcomes } from '@/entities/outcome';
import {
  PersonaIcon,
  UseCaseIcon,
  FeedbackIcon,
  OutcomeIcon,
} from '@/shared/ui';

// ── Types ──

export interface EntityData {
  personas: Persona[];
  useCases: UseCase[];
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

// ── Constants ──

const MAX_PREVIEW_ITEMS = 3;

// ── Dashboard Rules ──

export const DASHBOARD_RULES: DashboardRule[] = [
  {
    id: 'unlinked-feedback',
    title: 'Unlinked Feedback',
    icon: <FeedbackIcon />,
    severity: 'warning',
    actionLink: '/discovery/organize/feedback?unlinked=true',
    actionLabel: 'View all',
    bannerTemplate:
      '{count} feedback items are not linked to any persona — evidence quality may be affected',
    evaluate: ({ feedbacks }) => {
      const unlinked = feedbacks.filter(isUnlinkedFeedback);
      if (unlinked.length === 0) return null;
      return {
        count: unlinked.length,
        items: unlinked.slice(0, MAX_PREVIEW_ITEMS).map((f) => ({
          id: f.id,
          title: f.content,
          subtitle: 'no persona',
          tags: [
            {
              label: FEEDBACK_TYPE_CONFIG[f.type].label,
              color: FEEDBACK_TAG_COLORS[f.type],
            },
          ],
        })),
      };
    },
  },
  {
    id: 'stale-personas',
    title: 'Stale Personas',
    icon: <PersonaIcon />,
    severity: 'info',
    actionLink: '/discovery/organize/personas?stale=30',
    actionLabel: 'Review all',
    evaluate: ({ personas }) => {
      const stale = filterStalePersonas(personas)
        .map((p) => ({ persona: p, daysSinceUpdate: getDaysSinceUpdate(p) }))
        .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

      if (stale.length === 0) return null;
      return {
        count: stale.length,
        items: stale.slice(0, MAX_PREVIEW_ITEMS).map((s) => ({
          id: s.persona.id,
          title: s.persona.name,
          subtitle: `last updated ${s.daysSinceUpdate} days ago`,
        })),
      };
    },
  },
  {
    id: 'weak-evidence-use-cases',
    title: 'Weak Evidence',
    icon: <UseCaseIcon />,
    severity: 'info',
    actionLink: '/discovery/organize/use-cases?weakEvidence=true',
    actionLabel: 'View all',
    evaluate: ({ useCases }) => {
      const weak = filterWeakEvidenceUseCases(useCases);
      if (weak.length === 0) return null;
      return {
        count: weak.length,
        items: weak.slice(0, MAX_PREVIEW_ITEMS).map((uc) => ({
          id: uc.id,
          title: uc.name,
          subtitle: `${uc.feedbackIds?.length ?? 0} feedback · ${uc.personaIds?.length ?? 0} personas`,
        })),
      };
    },
  },
  {
    id: 'unlinked-outcomes',
    title: 'Unlinked Outcomes',
    icon: <OutcomeIcon />,
    severity: 'info',
    actionLink: '/discovery/organize/outcomes?unlinked=true',
    actionLabel: 'View all',
    evaluate: ({ outcomes }) => {
      const unlinked = filterUnlinkedOutcomes(outcomes);
      if (unlinked.length === 0) return null;
      return {
        count: unlinked.length,
        items: unlinked.slice(0, MAX_PREVIEW_ITEMS).map((o) => ({
          id: o.id,
          title: o.description,
          subtitle: 'no linked solution',
        })),
      };
    },
  },
];

// ── Stat Configs ──

export const STAT_CONFIGS: StatConfig[] = [
  {
    id: 'personas',
    label: 'Personas',
    icon: <PersonaIcon />,
    getData: (data) => data.personas,
    link: '/discovery/organize/personas',
  },
  {
    id: 'use-cases',
    label: 'Use Cases',
    icon: <UseCaseIcon />,
    getData: (data) => data.useCases,
    link: '/discovery/organize/use-cases',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: <FeedbackIcon />,
    getData: (data) => data.feedbacks,
    link: '/discovery/organize/feedback',
  },
  {
    id: 'outcomes',
    label: 'Outcomes',
    icon: <OutcomeIcon />,
    getData: (data) => data.outcomes,
    link: '/discovery/organize/outcomes',
  },
];
