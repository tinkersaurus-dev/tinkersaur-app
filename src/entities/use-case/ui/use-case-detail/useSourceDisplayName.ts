/**
 * Hook for resolving intake source display names
 */

import { useCallback } from 'react';
import { useIntakeSourceQuery } from '@/entities/intake-source';
import { SOURCE_TYPES, type SourceTypeKey } from '@/entities/source-type';

/**
 * Returns a formatted display name for an intake source
 * @param intakeSourceId - The ID of the intake source to resolve
 * @returns The display name string, or '—' if not available
 */
export function useSourceDisplayName(intakeSourceId: string | null | undefined): string {
  const { data: intakeSource } = useIntakeSourceQuery(intakeSourceId ?? undefined);

  const getDisplayName = useCallback((): string => {
    if (!intakeSource) return '—';
    if (intakeSource.meetingName) return intakeSource.meetingName;
    if (intakeSource.surveyName) return intakeSource.surveyName;
    if (intakeSource.ticketId) return `Ticket ${intakeSource.ticketId}`;
    const sourceType = intakeSource.sourceType as SourceTypeKey;
    return SOURCE_TYPES[sourceType]?.label || sourceType;
  }, [intakeSource]);

  return getDisplayName();
}
