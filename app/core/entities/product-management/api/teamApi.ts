import type { Team, CreateTeamDto } from '../types';
import { createEntityApi } from '~/core/api/createEntityApi';

export const teamApi = createEntityApi<Team, CreateTeamDto>({
  endpoint: '/api/teams',
  parentParam: 'organizationId',
});
