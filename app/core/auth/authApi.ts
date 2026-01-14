import { httpClient, clearAuthToken } from '~/core/api/httpClient';
import type { LoginApiResponse } from './types';

export const authApi = {
  login: async (email: string): Promise<LoginApiResponse> => {
    return httpClient.post<LoginApiResponse>('/api/auth/login', { email });
  },

  logout: (): void => {
    clearAuthToken();
  },
};
