import type { UseCase, CreateUseCaseDto } from '../types';
import { createEntityApi } from '~/core/api/createEntityApi';

const baseApi = createEntityApi<UseCase, CreateUseCaseDto>({
  endpoint: '/api/use-cases',
  parentParam: 'solutionId',
});

export const useCaseApi = {
  ...baseApi,
  listBySolution: baseApi.list,
};
