/**
 * User Entity
 * @module entities/user
 */

export {
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
} from './model/types';

export type {
  User,
  CreateUserDto,
  UpdateUserDto,
} from './model/types';

export { userApi } from './api/userApi';
