import type { IntakeSource, CreateIntakeSourceDto, UpdateIntakeSourceDto } from '../model/types';
import { createEntityApi } from '@/shared/api';

/**
 * IntakeSource API Client
 * Uses createEntityApi factory for standard CRUD operations
 */
export const intakeSourceApi = createEntityApi<IntakeSource, CreateIntakeSourceDto>({
  endpoint: '/api/intake-sources',
  parentParam: 'teamId',
});

// Re-export for backwards compatibility with UpdateIntakeSourceDto usage
export type { UpdateIntakeSourceDto };
