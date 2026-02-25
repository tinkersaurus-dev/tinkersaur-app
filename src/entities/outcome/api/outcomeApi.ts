import type {
  Outcome,
  CreateOutcomeDto,
  FindSimilarOutcomesRequest,
  SimilarOutcomeResult,
  MergeOutcomeRequest,
  MergeOutcomeResponse,
} from '../model/types';
import type { OutcomeListParams } from '@/shared/api';
import {
  createPaginatedEntityApi,
  httpClient,
  deserializeDates,
  deserializeDatesArray,
  type PaginatedEntityApi,
} from '@/shared/api';

type OutcomeApiExtensions = {
  listByTeam(teamId: string, solutionId?: string): Promise<Outcome[]>;
  findSimilar(request: FindSimilarOutcomesRequest): Promise<SimilarOutcomeResult[]>;
  merge(request: MergeOutcomeRequest): Promise<MergeOutcomeResponse>;
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
      async listByTeam(teamId: string, solutionId?: string): Promise<Outcome[]> {
        if (!solutionId) return typedApi.list(teamId);
        const data = await httpClient.get<Outcome[]>(
          `/api/outcomes?teamId=${teamId}&solutionId=${solutionId}`
        );
        return deserializeDatesArray(data);
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

      async merge(request: MergeOutcomeRequest): Promise<MergeOutcomeResponse> {
        const result = await httpClient.post<MergeOutcomeResponse>(
          '/api/outcomes/merge',
          request
        );
        return {
          ...result,
          parent: deserializeDates(result.parent),
        };
      },
    };
  },
});
