import type { FeedbackType } from '@/entities/feedback';

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
