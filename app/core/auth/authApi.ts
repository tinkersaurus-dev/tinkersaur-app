import { httpClient, clearAuthToken } from '~/core/api/httpClient';
import type { TeamAccessResponse } from './types';

export const authApi = {
  login: async (email: string): Promise<TeamAccessResponse> => {
    return httpClient.post<TeamAccessResponse>('/api/auth/login', { email });
  },

  logout: (): void => {
    clearAuthToken();
  },
};
