/**
 * Team Entity
 * @module entities/team
 */

export {
  TeamSchema,
  CreateTeamSchema,
  UpdateTeamSchema,
} from './model/types';

export type {
  Team,
  CreateTeamDto,
  UpdateTeamDto,
} from './model/types';

export { teamApi } from './api/teamApi';

export {
  useTeamsQuery,
  useTeamQuery,
  prefetchTeams,
  prefetchTeam,
} from './api/queries';

export {
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
} from './api/mutations';
