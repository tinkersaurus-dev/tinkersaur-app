import type { User, CreateUserDto } from '../types';
import { createEntityApi } from '~/core/api/createEntityApi';

export const userApi = createEntityApi<User, CreateUserDto>({
  endpoint: '/api/users',
  parentParam: 'teamId',
});
