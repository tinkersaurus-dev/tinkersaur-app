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
  MergeOutcomeRequest,
  MergeOutcomeResponse,
} from './model/types';

export { outcomeApi } from './api/outcomeApi';

// Query hooks
export { useOutcomesQuery, useOutcomeQuery, useOutcomesPaginatedQuery } from './api/queries';

// Mutation hooks
export { useDeleteOutcome, useUpdateOutcome } from './api/mutations';

// Filters
export { isUnlinkedOutcome, filterUnlinkedOutcomes } from './lib/filters';
