import type { FeedbackType } from '@/entities/feedback';

export interface TagSignal {
  tagName: string;
  signalStrength: number;
  normalizedStrength: number;
  feedbackCount: number;
  uniquePersonaCount: number;
  uniqueSourceCount: number;
}

export interface PainRadarRow {
  id: string;
  name: string;
  subtitle?: string;
  typeCounts: Record<FeedbackType, number>;
  painTotal: number;
  opportunityTotal: number;
}

export { PAIN_TYPES, OPPORTUNITY_TYPES } from '@/entities/feedback';
