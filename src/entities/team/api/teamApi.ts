import type { Team, CreateTeamDto } from '../model/types';
import { createEntityApi } from '@/shared/api';

export const teamApi = createEntityApi<Team, CreateTeamDto>({
  endpoint: '/api/teams',
  parentParam: 'organizationId',
});
