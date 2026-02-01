import { z } from 'zod';

/**
 * Source Type System
 * Defines the different types of intake sources (meeting transcripts, interviews, etc.)
 * Each source type has its own metadata fields and processing requirements.
 */

// Extensible source type keys
export const SourceTypeKeySchema = z.enum([
  'meeting-transcript',
  'user-interview',
  'stakeholder-interview',
  'support-ticket',
  'survey-response',
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
        name: 'date',
        label: 'Date',
        type: 'date',
        required: false,
      },
    ],
  },
  'user-interview': {
    key: 'user-interview',
    label: 'User Interview',
    description: 'Paste a transcript or notes from a user research interview',
    icon: 'FiUsers',
    metadataFields: [
      {
        name: 'meetingName',
        label: 'Meeting Name',
        type: 'text',
        required: false,
        placeholder: 'e.g., User Interview - John Smith',
      },
      {
        name: 'date',
        label: 'Date',
        type: 'date',
        required: false,
      },
    ],
  },
  'stakeholder-interview': {
    key: 'stakeholder-interview',
    label: 'Stakeholder Interview',
    description:
      'Paste a transcript from a business stakeholder interview (sponsors, executives)',
    icon: 'FiBriefcase',
    metadataFields: [
      {
        name: 'meetingName',
        label: 'Meeting Name',
        type: 'text',
        required: false,
        placeholder: 'e.g., Stakeholder Interview - Jane Doe',
      },
      {
        name: 'date',
        label: 'Date',
        type: 'date',
        required: false,
      },
    ],
  },
  'support-ticket': {
    key: 'support-ticket',
    label: 'Support Ticket',
    description: 'Paste content from a customer support ticket or conversation',
    icon: 'FiLifeBuoy',
    metadataFields: [
      {
        name: 'ticketId',
        label: 'Ticket ID',
        type: 'text',
        required: false,
        placeholder: 'e.g., TICKET-12345',
      },
      {
        name: 'ticketDate',
        label: 'Ticket Date',
        type: 'date',
        required: false,
      },
    ],
  },
  'survey-response': {
    key: 'survey-response',
    label: 'Survey Response',
    description: 'Paste open-ended responses from customer surveys',
    icon: 'FiClipboard',
    metadataFields: [
      {
        name: 'surveyName',
        label: 'Survey Name',
        type: 'text',
        required: false,
        placeholder: 'e.g., Q4 2024 Customer Satisfaction',
      },
      {
        name: 'responseDate',
        label: 'Response Date',
        type: 'date',
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
