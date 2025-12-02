import { httpClient, deserializeDates } from '~/core/api/httpClient';
import type { User } from '~/core/entities/product-management';

export const authApi = {
  login: async (email: string): Promise<User> => {
    const response = await httpClient.post<User>('/api/auth/login', { email });
    return deserializeDates(response);
  },
};
