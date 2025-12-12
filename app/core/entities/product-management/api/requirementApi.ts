import type { Requirement, CreateRequirementDto } from '../types';
import { createEntityApi } from '~/core/api/createEntityApi';

const baseApi = createEntityApi<Requirement, CreateRequirementDto>({
  endpoint: '/api/requirements',
  parentParam: 'useCaseId',
});

export const requirementApi = {
  ...baseApi,
  listByUseCase: baseApi.list,
};
