/**
 * Persona Entity
 * @module entities/persona
 */

export {
  DemographicsSchema,
  PersonaSchema,
  CreatePersonaSchema,
  UpdatePersonaSchema,
  FindSimilarPersonasRequestSchema,
  SimilarPersonaResultSchema,
  MergedPersonaDataSchema,
  MergePersonasRequestSchema,
} from './model/types';

export type {
  Demographics,
  Persona,
  CreatePersonaDto,
  UpdatePersonaDto,
  FindSimilarPersonasRequest,
  SimilarPersonaResult,
  MergedPersonaData,
  MergePersonasRequest,
} from './model/types';

export { personaApi } from './api/personaApi';

export {
  usePersonasQuery,
  usePersonaQuery,
  prefetchPersonas,
  prefetchPersona,
  usePersonasPaginatedQuery,
  useSimilarPersonasQuery,
  usePersonaDetailsQuery,
} from './api/queries';

export {
  useCreatePersona,
  useUpdatePersona,
  useDeletePersona,
} from './api/mutations';

export {
  mergePersonas,
  MergePersonasAPIError,
  type PersonaInput,
  type MergePersonasResponse,
} from './api/merge-personas-api';

export { PersonaCard } from './ui/PersonaCard';

// Filters
export {
  STALE_THRESHOLD_DAYS,
  FRESH_THRESHOLD_DAYS,
  MODERATE_THRESHOLD_DAYS,
  getDaysSinceUpdate,
  getDaysSinceLastIntake,
  getFreshness,
  isStalePersona,
  filterStalePersonas,
} from './lib/filters';
export type { Freshness } from './lib/filters';
