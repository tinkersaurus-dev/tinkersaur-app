/**
 * Outcome Entity
 * @module entities/outcome
 */

export {
  ExtractedOutcomeSchema,
  OutcomeSchema,
  CreateOutcomeSchema,
  UpdateOutcomeSchema,
} from './model/types';

export type {
  ExtractedOutcome,
  Outcome,
  CreateOutcomeDto,
  UpdateOutcomeDto,
  FindSimilarOutcomesRequest,
  SimilarOutcomeResult,
} from './model/types';

export { outcomeApi } from './api/outcomeApi';
