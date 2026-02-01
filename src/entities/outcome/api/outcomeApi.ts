import type {
  Outcome,
  CreateOutcomeDto,
  FindSimilarOutcomesRequest,
  SimilarOutcomeResult,
} from '../model/types';
import type { OutcomeListParams } from '@/shared/api';
import {
  createPaginatedEntityApi,
  httpClient,
  deserializeDates,
  type PaginatedEntityApi,
} from '@/shared/api';

type OutcomeApiExtensions = {
  listByTeam(teamId: string): Promise<Outcome[]>;
  findSimilar(request: FindSimilarOutcomesRequest): Promise<SimilarOutcomeResult[]>;
};

/**
 * Outcome API Client
 * Uses createPaginatedEntityApi factory with findSimilar extension
 */
export const outcomeApi = createPaginatedEntityApi<
  Outcome,
  CreateOutcomeDto,
  OutcomeListParams,
  OutcomeApiExtensions
>({
  endpoint: '/api/outcomes',
  parentParam: 'teamId',
  extensions: (baseApi) => {
    const typedApi = baseApi as PaginatedEntityApi<Outcome, CreateOutcomeDto, OutcomeListParams>;

    return {
      listByTeam(teamId: string): Promise<Outcome[]> {
        return typedApi.list(teamId);
      },

      async findSimilar(request: FindSimilarOutcomesRequest): Promise<SimilarOutcomeResult[]> {
        const data = await httpClient.post<SimilarOutcomeResult[]>(
          '/api/outcomes/similar',
          request
        );
        return data.map((result) => ({
          ...result,
          outcome: deserializeDates(result.outcome),
        }));
      },
    };
  },
});
