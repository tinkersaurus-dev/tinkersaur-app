import type { Requirement, CreateRequirementDto } from '../model/types';
import { createEntityApi, httpClient } from '@/shared/api';

const baseApi = createEntityApi<Requirement, CreateRequirementDto>({
  endpoint: '/api/requirements',
  parentParam: 'useCaseId',
});

export const requirementApi = {
  ...baseApi,
  listByUseCase: baseApi.list,
  listByTeam: async (teamId: string): Promise<Requirement[]> => {
    return httpClient.get<Requirement[]>(`/api/requirements?teamId=${teamId}`);
  },
};
