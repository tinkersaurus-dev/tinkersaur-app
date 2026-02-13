import { z } from 'zod';
import type { SourceTypeKey } from '@/entities/source-type';

/**
 * IntakeSource Schema and Types
 * Represents a source of intake data (meeting transcript, interview, etc.)
 */

export const IntakeSourceSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  sourceType: z.string(),
  meetingName: z.string().nullable(),
  date: z.string().nullable(), // ISO date string (YYYY-MM-DD)
  ticketId: z.string().nullable(),
  surveyName: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type IntakeSource = z.infer<typeof IntakeSourceSchema>;

export const CreateIntakeSourceSchema = z.object({
  teamId: z.string().uuid(),
  sourceType: z.string(),
  meetingName: z.string().optional(),
  date: z.string().optional(), // ISO date string (YYYY-MM-DD)
  ticketId: z.string().optional(),
  surveyName: z.string().optional(),
});

export type CreateIntakeSourceDto = z.infer<typeof CreateIntakeSourceSchema>;

export const UpdateIntakeSourceSchema = z.object({
  sourceType: z.string().optional(),
  meetingName: z.string().optional(),
  date: z.string().optional(),
  ticketId: z.string().optional(),
  surveyName: z.string().optional(),
});

export type UpdateIntakeSourceDto = z.infer<typeof UpdateIntakeSourceSchema>;

/**
 * Helper function to convert form metadata to CreateIntakeSourceDto
 */
export function metadataToIntakeSource(
  teamId: string,
  sourceType: SourceTypeKey,
  metadata: Record<string, string>
): CreateIntakeSourceDto {
  return {
    teamId,
    sourceType,
    meetingName: metadata.meetingName || metadata.documentName || undefined,
    date: metadata.date || metadata.ticketDate || metadata.responseDate || undefined,
    ticketId: metadata.ticketId || undefined,
    surveyName: metadata.surveyName || undefined,
  };
}
