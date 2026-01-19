/**
 * Shared types for use case detail components
 */

import type { QuoteWithSource } from '~/core/entities/discovery/types/Quote';

/**
 * Quote row type for the quotes table
 */
export interface QuoteRow {
  id: string;
  quote: string;
  source: string;
}

/**
 * Feedback row type for table display
 */
export interface FeedbackRow {
  id: string;
  content: string;
  quotes: QuoteWithSource[];
  sourceName: string;
  weight: number;
}

/**
 * Basic info form state for editing
 */
export interface BasicInfoFormState {
  name: string;
  description: string;
}

/**
 * Basic info validation errors
 */
export type BasicInfoErrors = Record<string, string>;
