import type { FeedbackType } from '../model/types';

export const ALL_FEEDBACK_TYPES: FeedbackType[] = [
  'suggestion', 'problem', 'concern', 'praise',
  'question', 'insight', 'workaround', 'context',
];

export const PAIN_TYPES: FeedbackType[] = ['problem', 'concern', 'workaround'];
export const OPPORTUNITY_TYPES: FeedbackType[] = ['suggestion', 'praise', 'insight', 'question', 'context'];

export const TYPE_COLORS: Record<FeedbackType, string> = {
  suggestion: '#5B5F8D',
  problem: '#DA6B51',
  concern: '#F1DCBA',
  praise: '#9BB29E',
  question: '#484149',
  insight: '#3B9EB5',
  workaround: '#C4883A',
  context: '#7A8494',
};

export function emptyTypeCounts(): Record<FeedbackType, number> {
  return Object.fromEntries(ALL_FEEDBACK_TYPES.map((t) => [t, 0])) as Record<FeedbackType, number>;
}

export function getPainTotal(counts: Record<FeedbackType, number>): number {
  return PAIN_TYPES.reduce((sum, t) => sum + counts[t], 0);
}

export function getOpportunityTotal(counts: Record<FeedbackType, number>): number {
  return OPPORTUNITY_TYPES.reduce((sum, t) => sum + counts[t], 0);
}
