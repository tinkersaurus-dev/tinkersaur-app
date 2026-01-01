import { z } from 'zod';

/**
 * Source Type System
 * Defines the different types of intake sources (meeting transcripts, interviews, etc.)
 * Each source type has its own metadata fields and processing requirements.
 */

// Extensible source type keys
export const SourceTypeKeySchema = z.enum([
  'meeting-transcript',
  // Future: 'user-interview', 'support-ticket', 'survey-response', etc.
]);

export type SourceTypeKey = z.infer<typeof SourceTypeKeySchema>;

// Metadata field definition for dynamic form generation
export interface SourceMetadataField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'datetime' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

// Complete source type definition
export interface SourceTypeDefinition {
  key: SourceTypeKey;
  label: string;
  description: string;
  icon: string; // react-icons name (e.g., 'FiMessageSquare')
  metadataFields: SourceMetadataField[];
}

// Registry of all available source types
export const SOURCE_TYPES: Record<SourceTypeKey, SourceTypeDefinition> = {
  'meeting-transcript': {
    key: 'meeting-transcript',
    label: 'Meeting Transcript',
    description: 'Paste a transcript from a meeting, interview, or recorded call',
    icon: 'FiMessageSquare',
    metadataFields: [
      {
        name: 'meetingName',
        label: 'Meeting Name',
        type: 'text',
        required: false,
        placeholder: 'e.g., Customer Discovery Call #5',
      },
      {
        name: 'meetingDate',
        label: 'Date/Time',
        type: 'datetime',
        required: false,
      },
    ],
  },
};

// Schema for transcript source input
export const TranscriptSourceSchema = z.object({
  sourceType: z.literal('meeting-transcript'),
  content: z.string().min(50, 'Transcript must be at least 50 characters'),
  metadata: z.object({
    meetingName: z.string().optional(),
    meetingDate: z.string().optional(), // ISO date string
  }),
});

export type TranscriptSource = z.infer<typeof TranscriptSourceSchema>;
