/**
 * Intake Source Entity
 * @module entities/intake-source
 */

export {
  IntakeSourceSchema,
  CreateIntakeSourceSchema,
  UpdateIntakeSourceSchema,
  metadataToIntakeSource,
} from './model/types';

export type {
  IntakeSource,
  CreateIntakeSourceDto,
  UpdateIntakeSourceDto,
} from './model/types';

export { intakeSourceApi } from './api/intakeSourceApi';

// Query hooks
export { useIntakeSourceQuery, useIntakeSourceDetailsQuery } from './api/queries';
