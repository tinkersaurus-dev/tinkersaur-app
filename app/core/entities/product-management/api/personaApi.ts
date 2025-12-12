import type { Persona, CreatePersonaDto } from '../types';
import { createEntityApi } from '~/core/api/createEntityApi';

export const personaApi = createEntityApi<Persona, CreatePersonaDto>({
  endpoint: '/api/personas',
  parentParam: 'teamId',
});
