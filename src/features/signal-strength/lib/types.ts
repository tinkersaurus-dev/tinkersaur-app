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

export const PAIN_TYPES: FeedbackType[] = ['problem', 'concern', 'workaround'];
export const OPPORTUNITY_TYPES: FeedbackType[] = ['suggestion', 'praise', 'insight', 'question', 'context'];
