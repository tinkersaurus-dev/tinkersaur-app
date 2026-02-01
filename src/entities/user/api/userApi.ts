import type { User, CreateUserDto } from '../model/types';
import { createEntityApi } from '@/shared/api';

export const userApi = createEntityApi<User, CreateUserDto>({
  endpoint: '/api/users',
  parentParam: 'teamId',
});
