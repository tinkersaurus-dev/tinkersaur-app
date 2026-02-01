import type {
  Persona,
  CreatePersonaDto,
  FindSimilarPersonasRequest,
  SimilarPersonaResult,
  MergePersonasRequest,
} from '../model/types';
import type { PersonaListParams } from '@/shared/api';
import {
  createPaginatedEntityApi,
  httpClient,
  deserializeDates,
} from '@/shared/api';

type PersonaApiExtensions = {
  findSimilar(request: FindSimilarPersonasRequest): Promise<SimilarPersonaResult[]>;
  merge(request: MergePersonasRequest): Promise<Persona>;
};

/**
 * Persona API Client
 * Uses createPaginatedEntityApi factory with findSimilar and merge extensions
 */
export const personaApi = createPaginatedEntityApi<
  Persona,
  CreatePersonaDto,
  PersonaListParams,
  PersonaApiExtensions
>({
  endpoint: '/api/personas',
  parentParam: 'teamId',
  extensions: () => ({
    async findSimilar(request: FindSimilarPersonasRequest): Promise<SimilarPersonaResult[]> {
      const data = await httpClient.post<SimilarPersonaResult[]>(
        '/api/personas/similar',
        request
      );
      return data.map((result) => ({
        ...result,
        persona: deserializeDates(result.persona),
      }));
    },

    async merge(request: MergePersonasRequest): Promise<Persona> {
      const result = await httpClient.post<Persona>('/api/personas/merge', request);
      return deserializeDates(result);
    },
  }),
});
