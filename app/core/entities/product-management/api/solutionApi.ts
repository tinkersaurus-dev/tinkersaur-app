import type { Solution, CreateSolutionDto } from '../types';
import { createEntityApi } from '~/core/api/createEntityApi';

export const solutionApi = createEntityApi<Solution, CreateSolutionDto>({
  endpoint: '/api/solutions',
  parentParam: 'teamId',
});
