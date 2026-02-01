/**
 * LLM Prompts for Intake Source Parsing
 * Each source type has its own specialized prompt for optimal extraction
 */

import type { SourceTypeKey } from '@/entities/source-type';

// Import source-type specific prompts
import { USER_INTERVIEW_SYSTEM_PROMPT } from './source-types/user-interview-prompts';
import { STAKEHOLDER_INTERVIEW_SYSTEM_PROMPT } from './source-types/stakeholder-interview-prompts';
import { MEETING_TRANSCRIPT_SYSTEM_PROMPT } from './source-types/meeting-transcript-prompts';
import { SUPPORT_TICKET_SYSTEM_PROMPT } from './source-types/support-ticket-prompts';
import { SURVEY_RESPONSE_SYSTEM_PROMPT } from './source-types/survey-response-prompts';

// Re-export all prompts for direct access if needed
export { USER_INTERVIEW_SYSTEM_PROMPT } from './source-types/user-interview-prompts';
export { STAKEHOLDER_INTERVIEW_SYSTEM_PROMPT } from './source-types/stakeholder-interview-prompts';
export { MEETING_TRANSCRIPT_SYSTEM_PROMPT } from './source-types/meeting-transcript-prompts';
export { SUPPORT_TICKET_SYSTEM_PROMPT } from './source-types/support-ticket-prompts';
export { SURVEY_RESPONSE_SYSTEM_PROMPT } from './source-types/survey-response-prompts';

/**
 * Prompt configuration for each source type
 */
interface PromptConfig {
  systemPrompt: string;
  contentLabel: string;
  metadataFormatter: (metadata: Record<string, unknown>) => string;
}

const PROMPT_REGISTRY: Record<SourceTypeKey, PromptConfig> = {
  'user-interview': {
    systemPrompt: USER_INTERVIEW_SYSTEM_PROMPT,
    contentLabel: 'Interview Transcript',
    metadataFormatter: (metadata) => {
      const lines: string[] = [];
      if (metadata.intervieweeName)
        lines.push(`Interviewee: ${metadata.intervieweeName}`);
      if (metadata.interviewDate) lines.push(`Date: ${metadata.interviewDate}`);
      if (metadata.interviewerName)
        lines.push(`Interviewer: ${metadata.interviewerName}`);
      return lines.join('\n');
    },
  },
  'stakeholder-interview': {
    systemPrompt: STAKEHOLDER_INTERVIEW_SYSTEM_PROMPT,
    contentLabel: 'Stakeholder Interview Transcript',
    metadataFormatter: (metadata) => {
      const lines: string[] = [];
      if (metadata.intervieweeName)
        lines.push(`Interviewee: ${metadata.intervieweeName}`);
      if (metadata.stakeholderRole)
        lines.push(`Role: ${metadata.stakeholderRole}`);
      if (metadata.interviewDate) lines.push(`Date: ${metadata.interviewDate}`);
      if (metadata.interviewerName)
        lines.push(`Interviewer: ${metadata.interviewerName}`);
      return lines.join('\n');
    },
  },
  'meeting-transcript': {
    systemPrompt: MEETING_TRANSCRIPT_SYSTEM_PROMPT,
    contentLabel: 'Meeting Transcript',
    metadataFormatter: (metadata) => {
      const lines: string[] = [];
      if (metadata.meetingName) lines.push(`Meeting: ${metadata.meetingName}`);
      if (metadata.meetingDate) lines.push(`Date: ${metadata.meetingDate}`);
      return lines.join('\n');
    },
  },
  'support-ticket': {
    systemPrompt: SUPPORT_TICKET_SYSTEM_PROMPT,
    contentLabel: 'Support Ticket',
    metadataFormatter: (metadata) => {
      const lines: string[] = [];
      if (metadata.ticketId) lines.push(`Ticket ID: ${metadata.ticketId}`);
      if (metadata.ticketDate) lines.push(`Date: ${metadata.ticketDate}`);
      if (metadata.customerSegment)
        lines.push(`Customer Segment: ${metadata.customerSegment}`);
      return lines.join('\n');
    },
  },
  'survey-response': {
    systemPrompt: SURVEY_RESPONSE_SYSTEM_PROMPT,
    contentLabel: 'Survey Response',
    metadataFormatter: (metadata) => {
      const lines: string[] = [];
      if (metadata.surveyName) lines.push(`Survey: ${metadata.surveyName}`);
      if (metadata.responseDate) lines.push(`Date: ${metadata.responseDate}`);
      if (metadata.respondentId)
        lines.push(`Respondent ID: ${metadata.respondentId}`);
      return lines.join('\n');
    },
  },
};

/**
 * Get system prompt for a specific source type
 */
export function getSystemPromptForSourceType(sourceType: SourceTypeKey): string {
  const config = PROMPT_REGISTRY[sourceType];
  if (!config) {
    // Fallback to user interview prompt (baseline)
    return USER_INTERVIEW_SYSTEM_PROMPT;
  }
  return config.systemPrompt;
}

/**
 * Builds the user prompt with source content and metadata
 * Handles all source types and their specific metadata fields
 */
export function buildUserPrompt(
  sourceType: SourceTypeKey,
  content: string,
  metadata: Record<string, unknown>
): string {
  const config = PROMPT_REGISTRY[sourceType] ?? PROMPT_REGISTRY['user-interview'];

  let prompt = `Analyze the following ${config.contentLabel.toLowerCase()} and extract personas, use cases, and feedback.\n\n`;

  const formattedMetadata = config.metadataFormatter(metadata);
  if (formattedMetadata) {
    prompt += `${formattedMetadata}\n\n`;
  }

  prompt += `---${config.contentLabel.toUpperCase()} START---\n${content}\n---${config.contentLabel.toUpperCase()} END---\n\n`;
  prompt += `Extract all personas, use cases, and feedback from this ${config.contentLabel.toLowerCase()}. Return ONLY valid JSON matching the specified schema.`;

  return prompt;
}

// Legacy exports for backward compatibility
/** @deprecated Use getSystemPromptForSourceType('user-interview') instead */
export const TRANSCRIPT_PARSING_SYSTEM_PROMPT = USER_INTERVIEW_SYSTEM_PROMPT;

/** @deprecated Use buildUserPrompt() instead */
export function buildTranscriptUserPrompt(
  content: string,
  metadata: Record<string, unknown>
): string {
  return buildUserPrompt('meeting-transcript', content, metadata);
}
