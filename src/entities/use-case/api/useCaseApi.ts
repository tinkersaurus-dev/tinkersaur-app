import type {
  UseCase,
  CreateUseCaseDto,
  FindSimilarUseCasesRequest,
  SimilarUseCaseResult,
  MergeUseCasesRequest,
} from '../model/types';
import type { UseCaseListParams } from '@/shared/api';
import {
  createPaginatedEntityApi,
  httpClient,
  deserializeDates,
  deserializeDatesArray,
} from '@/shared/api';

type UseCaseApiExtensions = {
  listByTeam(teamId: string, unassignedOnly?: boolean): Promise<UseCase[]>;
  listBySolution(solutionId: string): Promise<UseCase[]>;
  findSimilar(request: FindSimilarUseCasesRequest): Promise<SimilarUseCaseResult[]>;
  merge(request: MergeUseCasesRequest): Promise<UseCase>;
};

/**
 * UseCase API Client
 * Uses createPaginatedEntityApi factory with additional list methods and merge extensions
 */
export const useCaseApi = createPaginatedEntityApi<
  UseCase,
  CreateUseCaseDto,
  UseCaseListParams,
  UseCaseApiExtensions
>({
  endpoint: '/api/use-cases',
  parentParam: 'teamId',
  extensions: () => ({
    async listByTeam(teamId: string, unassignedOnly = false): Promise<UseCase[]> {
      const url = `/api/use-cases?teamId=${teamId}${unassignedOnly ? '&unassignedOnly=true' : ''}`;
      const data = await httpClient.get<UseCase[]>(url);
      return deserializeDatesArray(data);
    },

    async listBySolution(solutionId: string): Promise<UseCase[]> {
      const url = `/api/use-cases?solutionId=${solutionId}`;
      const data = await httpClient.get<UseCase[]>(url);
      return deserializeDatesArray(data);
    },

    async findSimilar(request: FindSimilarUseCasesRequest): Promise<SimilarUseCaseResult[]> {
      const data = await httpClient.post<SimilarUseCaseResult[]>(
        '/api/use-cases/similar',
        request
      );
      return data.map((result) => ({
        ...result,
        useCase: deserializeDates(result.useCase),
      }));
    },

    async merge(request: MergeUseCasesRequest): Promise<UseCase> {
      const result = await httpClient.post<UseCase>('/api/use-cases/merge', request);
      return deserializeDates(result);
    },
  }),
});
