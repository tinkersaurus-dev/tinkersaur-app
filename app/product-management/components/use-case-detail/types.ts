/**
 * Shared types for use case detail components
 */

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
  quotes: string[];
  sourceName: string;
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
