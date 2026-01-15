import { httpClient, clearAuthToken } from '~/core/api/httpClient';
import type {
  LoginApiResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  MessageResponse,
} from './types';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginApiResponse> => {
    return httpClient.post<LoginApiResponse>('/api/auth/login', { email, password });
  },

  forgotPassword: async (email: string): Promise<MessageResponse> => {
    return httpClient.post<MessageResponse>('/api/auth/forgot-password', { email } as ForgotPasswordRequest);
  },

  resetPassword: async (email: string, token: string, newPassword: string): Promise<MessageResponse> => {
    return httpClient.post<MessageResponse>('/api/auth/reset-password', {
      email,
      token,
      newPassword,
    } as ResetPasswordRequest);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<MessageResponse> => {
    return httpClient.post<MessageResponse>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    } as ChangePasswordRequest);
  },

  logout: (): void => {
    clearAuthToken();
  },
};
