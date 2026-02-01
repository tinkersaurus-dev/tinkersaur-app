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

export { PersonaCard } from './ui/PersonaCard';
