import type {
  UserGoal,
  CreateUserGoalDto,
  FindSimilarUserGoalsRequest,
  SimilarUserGoalResult,
  MergeUserGoalsRequest,
  PromoteUserGoalRequest,
} from '../model/types';
import type { UserGoalListParams } from '@/shared/api';
import {
  createPaginatedEntityApi,
  httpClient,
  deserializeDates,
  deserializeDatesArray,
} from '@/shared/api';

// Import UseCase type for promote response
import type { UseCase } from '@/entities/use-case';

type UserGoalApiExtensions = {
  listByTeam(teamId: string): Promise<UserGoal[]>;
  findSimilar(request: FindSimilarUserGoalsRequest): Promise<SimilarUserGoalResult[]>;
  merge(request: MergeUserGoalsRequest): Promise<UserGoal>;
  promote(request: PromoteUserGoalRequest): Promise<UseCase>;
};

/**
 * UserGoal API Client
 * Uses createPaginatedEntityApi factory with additional list, similarity, merge, and promote extensions
 */
export const userGoalApi = createPaginatedEntityApi<
  UserGoal,
  CreateUserGoalDto,
  UserGoalListParams,
  UserGoalApiExtensions
>({
  endpoint: '/api/user-goals',
  parentParam: 'teamId',
  extensions: () => ({
    async listByTeam(teamId: string): Promise<UserGoal[]> {
      const url = `/api/user-goals?teamId=${teamId}`;
      const data = await httpClient.get<UserGoal[]>(url);
      return deserializeDatesArray(data);
    },

    async findSimilar(request: FindSimilarUserGoalsRequest): Promise<SimilarUserGoalResult[]> {
      const data = await httpClient.post<SimilarUserGoalResult[]>(
        '/api/user-goals/similar',
        request,
      );
      return data.map((result) => ({
        ...result,
        userGoal: deserializeDates(result.userGoal),
      }));
    },

    async merge(request: MergeUserGoalsRequest): Promise<UserGoal> {
      const result = await httpClient.post<UserGoal>('/api/user-goals/merge', request);
      return deserializeDates(result);
    },

    async promote(request: PromoteUserGoalRequest): Promise<UseCase> {
      const result = await httpClient.post<UseCase>('/api/user-goals/promote', request);
      return deserializeDates(result);
    },
  }),
});
