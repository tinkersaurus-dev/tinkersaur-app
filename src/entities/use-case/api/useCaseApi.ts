import type {
  UseCase,
  CreateUseCaseDto,
} from '../model/types';
import type { UseCaseListParams } from '@/shared/api';
import {
  createPaginatedEntityApi,
  httpClient,
  deserializeDatesArray,
} from '@/shared/api';

type UseCaseApiExtensions = {
  listByTeam(teamId: string): Promise<UseCase[]>;
  listBySolution(solutionId: string): Promise<UseCase[]>;
};

/**
 * UseCase API Client
 * Uses createPaginatedEntityApi factory with additional list methods
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
    async listByTeam(teamId: string): Promise<UseCase[]> {
      const url = `/api/use-cases?teamId=${teamId}`;
      const data = await httpClient.get<UseCase[]>(url);
      return deserializeDatesArray(data);
    },

    async listBySolution(solutionId: string): Promise<UseCase[]> {
      const url = `/api/use-cases?solutionId=${solutionId}`;
      const data = await httpClient.get<UseCase[]>(url);
      return deserializeDatesArray(data);
    },
  }),
});
