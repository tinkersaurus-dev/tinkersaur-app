import type { Requirement, CreateRequirementDto } from '../model/types';
import { createEntityApi } from '@/shared/api';

const baseApi = createEntityApi<Requirement, CreateRequirementDto>({
  endpoint: '/api/requirements',
  parentParam: 'useCaseId',
});

export const requirementApi = {
  ...baseApi,
  listByUseCase: baseApi.list,
};
