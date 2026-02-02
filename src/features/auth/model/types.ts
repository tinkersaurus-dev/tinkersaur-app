export type TeamRole = 'Edit' | 'View';

export interface TeamAccess {
  teamId: string;
  teamName: string;
  role: TeamRole;
  isPrimary: boolean;
}

export interface SelectedTeam {
  teamId: string;
  teamName: string;
  canEdit: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

export interface TeamAccessResponse {
  userId: string;
  email: string;
  name: string;
  primaryTeamId: string;
  teamAccess: TeamAccess[];
}

export interface LoginApiResponse {
  userId: string;
  email: string;
  name: string;
  primaryTeamId: string;
  teamAccess: TeamAccess[];
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
  mustChangePassword: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export interface SignalRTokenResponse {
  signalRToken: string;
  expiresAt: string;
}
