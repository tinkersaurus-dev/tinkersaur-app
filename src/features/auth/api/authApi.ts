import { httpClient, clearAuthToken, getRefreshToken } from '@/shared/api';
import type {
  LoginApiResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  MessageResponse,
  RefreshTokenRequest,
  SignalRTokenResponse,
} from '../model/types';

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

  logout: async (): Promise<void> => {
    // Revoke the refresh token on the server before clearing local state
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await httpClient.post<MessageResponse>('/api/auth/revoke', {
          refreshToken,
        } as RefreshTokenRequest);
      } catch {
        // Ignore errors - we still want to clear local state
      }
    }
    clearAuthToken();
  },

  getSignalRToken: async (): Promise<SignalRTokenResponse> => {
    return httpClient.post<SignalRTokenResponse>('/api/auth/signalr-token', {});
  },
};
