import type { Solution, CreateSolutionDto } from '../model/types';
import { createEntityApi } from '@/shared/api';

export const solutionApi = createEntityApi<Solution, CreateSolutionDto>({
  endpoint: '/api/solutions',
  parentParam: 'teamId',
});
